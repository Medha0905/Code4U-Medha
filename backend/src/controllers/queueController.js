const prisma = require('../config/db');
const { ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/validate');
const queueService = require('../services/queueService');

const getShopQueue = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const queue = await prisma.queueEntry.findMany({
    where: { shopId, leftAt: null },
    orderBy: { position: 'asc' },
    include: { order: { select: { tokenNumber: true, status: true } } },
  });
  const load = await queueService.getKitchenLoad(shopId);
  return ok(res, { queue, kitchenLoad: load });
});

const getMyQueueStatus = asyncHandler(async (req, res) => {
  const entry = await prisma.queueEntry.findFirst({
    where: { studentId: req.user.profileId, leftAt: null },
    orderBy: { enteredAt: 'desc' },
    include: { order: true, shop: true },
  });
  if (!entry) return ok(res, null, 'No active queue entry');

  const ordersAhead = entry.position - 1;
  return ok(res, { ...entry, ordersAhead });
});

module.exports = { getShopQueue, getMyQueueStatus };
