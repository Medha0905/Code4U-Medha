const prisma = require('../config/db');
const { ApiError, ok, created } = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/validate');
const { emitNewMessage } = require('../sockets');

/** Confirms the requester is either the student who placed the order, or the vendor who owns its shop. */
async function assertParticipant(order, user) {
  if (user.role === 'STUDENT' && order.studentId === user.profileId) return;
  if (user.role === 'VENDOR' && order.shop.vendorId === user.profileId) return;
  throw new ApiError(403, 'You are not part of this order');
}

const listMessages = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.orderId }, include: { shop: true } });
  if (!order) throw new ApiError(404, 'Order not found');
  await assertParticipant(order, req.user);

  const messages = await prisma.message.findMany({
    where: { orderId: order.id },
    orderBy: { createdAt: 'asc' },
  });
  return ok(res, messages);
});

const sendMessage = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) throw new ApiError(422, 'Message cannot be empty');
  if (text.length > 500) throw new ApiError(422, 'Message is too long (max 500 characters)');

  const order = await prisma.order.findUnique({
    where: { id: req.params.orderId },
    include: { shop: { include: { vendor: true } }, student: true },
  });
  if (!order) throw new ApiError(404, 'Order not found');
  await assertParticipant(order, req.user);

  const message = await prisma.message.create({
    data: {
      orderId: order.id,
      senderRole: req.user.role,
      senderId: req.user.id,
      text: text.trim(),
    },
  });

  // Notify the other party's socket room for this specific order.
  const io = req.app.get('io');
  emitNewMessage(io, order.id, message);

  // Also drop a lightweight notification for the recipient in case they're not viewing this order.
  const recipientUserId = req.user.role === 'STUDENT' ? order.shop.vendor.userId : order.student.userId;
  const notification = await prisma.notification.create({
    data: {
      userId: recipientUserId,
      type: 'SYSTEM',
      title: `New message — Order #${order.tokenNumber}`,
      message: text.trim().slice(0, 100),
    },
  });
  require('../sockets').emitNotification(io, recipientUserId, notification);

  return created(res, message, 'Message sent');
});

module.exports = { listMessages, sendMessage };
