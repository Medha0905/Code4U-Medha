const prisma = require('../config/db');
const { ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/validate');

const listMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return ok(res, notifications);
});

const markRead = asyncHandler(async (req, res) => {
  await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
  return ok(res, null, 'Marked as read');
});

const markAllRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
  return ok(res, null, 'All notifications marked as read');
});

module.exports = { listMyNotifications, markRead, markAllRead };
