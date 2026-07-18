const prisma = require('../config/db');
const { ApiError, ok, created } = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/validate');
const inventoryService = require('../services/inventoryService');
const queueService = require('../services/queueService');
const codService = require('../services/codService');
const { generateQrDataUrl } = require('../utils/qr');
const sockets = require('../sockets');

async function notify(io, userId, type, title, message) {
  const notification = await prisma.notification.create({ data: { userId, type, title, message } });
  sockets.emitNotification(io, userId, notification);
  return notification;
}

/**
 * Recomputes the true unit price for an ordered item from the menu item's
 * own stored customization options — never trusts a price the client sends,
 * so a tampered request can't apply a discount or free add-ons.
 */
function resolveUnitPrice(menuItem, selectedCustomizations) {
  let extra = 0;
  if (selectedCustomizations?.length && menuItem.customizations?.length) {
    const optionsByLabel = Object.fromEntries(
      menuItem.customizations.flatMap((group) => group.options.map((o) => [o.label, o.extraPrice])),
    );
    for (const label of selectedCustomizations) {
      extra += Number(optionsByLabel[label] || 0);
    }
  }
  return Number(menuItem.price) + extra;
}

/** Place an order (immediate or scheduled). Bulk orders use placeBulkOrder below. */
const placeOrder = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const { shopId, items, paymentMethod, type, scheduledPickupAt, specialInstructions } = req.body;

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new ApiError(404, 'Shop not found');
  if (shop.status !== 'OPEN') throw new ApiError(409, 'This shop is currently closed');
  if (shop.status === 'PAUSED') throw new ApiError(409, 'Kitchen busy — please try again later');

  if (paymentMethod === 'COD') {
    const codCheck = await codService.isCodAllowed(req.user.profileId, shopId);
    if (!codCheck.allowed) throw new ApiError(403, codCheck.reason);
  }

  const menuItems = await prisma.menuItem.findMany({ where: { id: { in: items.map((i) => i.menuItemId) }, shopId } });
  if (menuItems.length !== items.length) throw new ApiError(400, 'One or more items are invalid for this shop');

  const byId = Object.fromEntries(menuItems.map((m) => [m.id, m]));
  let totalAmount = 0;
  for (const it of items) {
    const menuItem = byId[it.menuItemId];
    if (menuItem.availability === 'SOLD_OUT') throw new ApiError(409, `${menuItem.name} is sold out`);
    it.resolvedUnitPrice = resolveUnitPrice(menuItem, it.selectedCustomizations);
    totalAmount += it.resolvedUnitPrice * it.quantity;
  }

  const tokenNumber = (await prisma.order.count({ where: { shopId } })) + 1001;

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        studentId: req.user.profileId,
        shopId,
        type: type || 'IMMEDIATE',
        totalAmount,
        paymentMethod,
        scheduledPickupAt: scheduledPickupAt ? new Date(scheduledPickupAt) : null,
        specialInstructions,
        tokenNumber,
        items: {
          create: items.map((it) => ({
            menuItemId: it.menuItemId,
            quantity: it.quantity,
            unitPrice: it.resolvedUnitPrice,
            selectedCustomizations: it.selectedCustomizations || undefined,
          })),
        },
        payment: {
          create: {
            method: paymentMethod,
            amount: totalAmount,
            status: paymentMethod === 'COD' ? 'PENDING' : 'PAID',
            paidAt: paymentMethod === 'COD' ? null : new Date(),
          },
        },
      },
      include: { items: { include: { menuItem: true } } },
    });

    const lowStockAlerts = await inventoryService.deductStockForOrder(tx, items, io);

    const position = await queueService.nextQueuePosition(shopId);
    const prepTimes = order.items.map((it) => it.menuItem.prepTimeMinutes);
    const waitMinutes = await queueService.predictWaitMinutes(shopId, prepTimes);

    const queueEntry = await tx.queueEntry.create({
      data: {
        orderId: order.id,
        shopId,
        studentId: req.user.profileId,
        position,
        estimatedWaitMinutes: waitMinutes,
      },
    });

    return { order, lowStockAlerts, queueEntry, waitMinutes };
  });

  const qrDataUrl = await generateQrDataUrl(result.order.qrToken);

  await notify(io, req.user.id, 'ORDER_ACCEPTED', 'Order Placed', `Your order #${tokenNumber} has been placed.`);

  for (const alert of result.lowStockAlerts) {
    const vendor = await prisma.shop.findUnique({ where: { id: alert.shopId }, include: { vendor: true } });
    await notify(io, vendor.vendor.userId, 'LOW_STOCK', 'Low Stock Alert', `Only ${alert.remaining} ${alert.itemName} left.`);
  }

  const fullQueue = await queueService.resequenceQueue(shopId);
  sockets.emitQueueUpdate(io, shopId, fullQueue);
  sockets.emitOrderStatusUpdate(io, shopId, result.order);

  return created(res, { ...result.order, qrDataUrl, queuePosition: result.queueEntry.position, estimatedWaitMinutes: result.waitMinutes }, 'Order placed successfully');
});

const VALID_TRANSITIONS = {
  PLACED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['COMPLETED'],
};

const updateOrderStatus = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const { status } = req.body;
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { shop: true, student: true } });
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.shop.vendorId !== req.user.profileId) throw new ApiError(403, 'Not your shop');

  const allowed = VALID_TRANSITIONS[order.status] || [];
  if (!allowed.includes(status)) throw new ApiError(400, `Cannot move order from ${order.status} to ${status}`);

  const timestampField = {
    ACCEPTED: 'acceptedAt',
    PREPARING: 'preparingAt',
    READY: 'readyAt',
    COMPLETED: 'completedAt',
  }[status];

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status, ...(timestampField ? { [timestampField]: new Date() } : {}) },
  });

  const messages = {
    ACCEPTED: ['ORDER_ACCEPTED', 'Order Accepted', `Your order #${order.tokenNumber} has been accepted.`],
    PREPARING: ['ORDER_PREPARING', 'Preparing', `Your order #${order.tokenNumber} is being prepared.`],
    READY: ['ORDER_READY', 'Ready for Pickup', `Your order #${order.tokenNumber} is ready! Please collect it.`],
  };
  if (messages[status]) {
    const [type, title, msg] = messages[status];
    await notify(io, order.student.userId, type, title, msg);
  }

  sockets.emitOrderStatusUpdate(io, order.shopId, updated);

  if (status === 'CANCELLED') {
    await prisma.queueEntry.updateMany({ where: { orderId: order.id }, data: { leftAt: new Date() } });
    const queue = await queueService.resequenceQueue(order.shopId);
    sockets.emitQueueUpdate(io, order.shopId, queue);
  }

  const load = await queueService.getKitchenLoad(order.shopId);
  sockets.emitKitchenLoad(io, order.shopId, load);

  return ok(res, updated, `Order marked as ${status}`);
});

/** Vendor scans a student's QR pickup token. */
const scanQrToken = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const { qrToken } = req.body;

  const order = await prisma.order.findUnique({
    where: { qrToken },
    include: { student: { include: { user: true } }, items: { include: { menuItem: true } }, payment: true, shop: true },
  });
  if (!order) throw new ApiError(404, 'Invalid QR token');
  if (order.shop.vendorId !== req.user.profileId) throw new ApiError(403, 'This order does not belong to your shop');

  if (order.isScanned) {
    return ok(res, { alreadyScanned: true, order }, 'This order has already been collected.');
  }

  return ok(res, {
    alreadyScanned: false,
    order: {
      id: order.id,
      tokenNumber: order.tokenNumber,
      studentName: order.student.fullName,
      items: order.items.map((i) => ({ name: i.menuItem.name, quantity: i.quantity, unitPrice: i.unitPrice })),
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.payment?.status,
      scheduledPickupAt: order.scheduledPickupAt,
    },
  }, 'Order verified');
});

/** Completes an order after QR verification: marks scanned + completed, updates queue/analytics. */
const completeOrderByQr = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const { qrToken } = req.body;

  const order = await prisma.order.findUnique({ where: { qrToken }, include: { shop: true, student: { include: { user: true } }, payment: true } });
  if (!order) throw new ApiError(404, 'Invalid QR token');
  if (order.shop.vendorId !== req.user.profileId) throw new ApiError(403, 'This order does not belong to your shop');
  if (order.isScanned) throw new ApiError(409, 'This order has already been collected.');

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { isScanned: true, scannedAt: new Date(), status: 'COMPLETED', completedAt: new Date() },
  });

  if (order.paymentMethod === 'COD') {
    await prisma.payment.update({ where: { orderId: order.id }, data: { status: 'PAID', paidAt: new Date() } });
  }

  await prisma.queueEntry.updateMany({ where: { orderId: order.id }, data: { leftAt: new Date() } });
  const queue = await queueService.resequenceQueue(order.shopId);
  sockets.emitQueueUpdate(io, order.shopId, queue);
  sockets.emitOrderStatusUpdate(io, order.shopId, updated);

  await notify(io, order.student.userId, 'ORDER_COMPLETED', 'Order Completed', `Order #${order.tokenNumber} collected. Enjoy your meal!`);

  return ok(res, updated, 'Order completed successfully');
});

/** Marks a COD order as a no-show (vendor action) — escalates per-shop COD strikes. */
const markNoShow = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { shop: true } });
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.shop.vendorId !== req.user.profileId) throw new ApiError(403, 'Not your shop');
  if (order.paymentMethod !== 'COD') throw new ApiError(400, 'No-show tracking only applies to COD orders');

  await prisma.order.update({ where: { id: order.id }, data: { status: 'NO_SHOW' } });
  const strikeResult = await codService.recordNoShow(order.studentId, order.shopId);

  const io = req.app.get('io');
  await prisma.queueEntry.updateMany({ where: { orderId: order.id }, data: { leftAt: new Date() } });
  const queue = await queueService.resequenceQueue(order.shopId);
  sockets.emitQueueUpdate(io, order.shopId, queue);

  return ok(res, strikeResult, 'No-show recorded');
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { studentId: req.user.profileId },
    include: { items: { include: { menuItem: true } }, shop: true, queueEntry: true },
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, orders);
});

const getShopOrders = asyncHandler(async (req, res) => {
  const shop = await prisma.shop.findUnique({ where: { vendorId: req.user.profileId } });
  if (!shop) throw new ApiError(404, 'Shop not found');

  const { status } = req.query;
  const orders = await prisma.order.findMany({
    where: { shopId: shop.id, ...(status ? { status } : {}) },
    include: { items: { include: { menuItem: true } }, student: { include: { user: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, orders);
});

module.exports = {
  placeOrder,
  updateOrderStatus,
  scanQrToken,
  completeOrderByQr,
  markNoShow,
  getMyOrders,
  getShopOrders,
};
