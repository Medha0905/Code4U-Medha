const prisma = require('../config/db');
const { ApiError, ok, created } = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/validate');
const inventoryService = require('../services/inventoryService');
const sockets = require('../sockets');

/** Bulk order placement (clubs/events/parties) with optional seat booking. */
const placeBulkOrder = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const {
    shopId, items, numberOfPeople, eventDate, servingTime, eatingTime,
    specialInstructions, paymentMethod, seatBooking,
  } = req.body;

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new ApiError(404, 'Shop not found');

  const menuItems = await prisma.menuItem.findMany({ where: { id: { in: items.map((i) => i.menuItemId) }, shopId } });
  const byId = Object.fromEntries(menuItems.map((m) => [m.id, m]));
  let totalAmount = 0;
  for (const it of items) totalAmount += Number(byId[it.menuItemId].price) * it.quantity;

  const tokenNumber = (await prisma.order.count({ where: { shopId } })) + 1001;

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        studentId: req.user.profileId,
        shopId,
        type: 'BULK',
        totalAmount,
        paymentMethod,
        specialInstructions,
        tokenNumber,
        status: 'PLACED',
        items: { create: items.map((it) => ({ menuItemId: it.menuItemId, quantity: it.quantity, unitPrice: byId[it.menuItemId].price })) },
        payment: { create: { method: paymentMethod, amount: totalAmount, status: paymentMethod === 'COD' ? 'PENDING' : 'PAID' } },
      },
    });

    const bulkOrder = await tx.bulkOrder.create({
      data: {
        orderId: order.id,
        studentId: req.user.profileId,
        shopId,
        numberOfPeople,
        eventDate: new Date(eventDate),
        servingTime,
        eatingTime,
        specialInstructions,
      },
    });

    let seatReservation = null;
    if (seatBooking) {
      seatReservation = await tx.seatReservation.create({
        data: {
          bulkOrderId: bulkOrder.id,
          studentId: req.user.profileId,
          shopId,
          numberOfPeople,
          preferredTime: new Date(eventDate),
        },
      });
    }

    return { order, bulkOrder, seatReservation };
  });

  const vendor = await prisma.shop.findUnique({ where: { id: shopId }, include: { vendor: true } });
  const notification = await prisma.notification.create({
    data: {
      userId: vendor.vendor.userId,
      type: 'BULK_ORDER',
      title: 'New Bulk Order Request',
      message: `A bulk order for ${numberOfPeople} people has been requested.`,
    },
  });
  sockets.emitNotification(io, vendor.vendor.userId, notification);

  return created(res, result, 'Bulk order placed — awaiting vendor confirmation');
});

const listShopBulkOrders = asyncHandler(async (req, res) => {
  const shop = await prisma.shop.findUnique({ where: { vendorId: req.user.profileId } });
  if (!shop) throw new ApiError(404, 'Shop not found');

  const bulkOrders = await prisma.bulkOrder.findMany({
    where: { shopId: shop.id },
    include: { order: true, student: { include: { user: true } }, seatReservation: true },
    orderBy: { eventDate: 'asc' },
  });
  return ok(res, bulkOrders);
});

const listMyBulkOrders = asyncHandler(async (req, res) => {
  const bulkOrders = await prisma.bulkOrder.findMany({
    where: { studentId: req.user.profileId },
    include: { order: true, seatReservation: true },
    orderBy: { eventDate: 'desc' },
  });
  return ok(res, bulkOrders);
});

module.exports = { placeBulkOrder, listShopBulkOrders, listMyBulkOrders };
