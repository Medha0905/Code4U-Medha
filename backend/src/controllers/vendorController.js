const prisma = require('../config/db');
const { ApiError, ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/validate');

const markTutorialSeen = asyncHandler(async (req, res) => {
  const vendor = await prisma.vendor.update({ where: { id: req.user.profileId }, data: { hasSeenTutorial: true } });
  return ok(res, vendor, 'Tutorial marked as seen');
});

const replayTutorial = asyncHandler(async (req, res) => {
  const vendor = await prisma.vendor.update({ where: { id: req.user.profileId }, data: { hasSeenTutorial: false } });
  return ok(res, vendor, 'Tutorial reset — it will show again');
});

const toggleAutoPause = asyncHandler(async (req, res) => {
  const { enabled } = req.body;
  const shop = await prisma.shop.findUnique({ where: { vendorId: req.user.profileId } });
  if (!shop) throw new ApiError(404, 'Shop not found');
  const updated = await prisma.shop.update({ where: { id: shop.id }, data: { autoPauseEnabled: enabled } });
  return ok(res, updated, `Auto-pause ${enabled ? 'enabled' : 'disabled'}`);
});

module.exports = { markTutorialSeen, replayTutorial, toggleAutoPause };
