const prisma = require('../config/db');
const { ApiError, ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/validate');

const listStudents = asyncHandler(async (req, res) => {
  const students = await prisma.student.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } });
  return ok(res, students);
});

const listVendors = asyncHandler(async (req, res) => {
  const vendors = await prisma.vendor.findMany({ include: { user: true, shop: true }, orderBy: { createdAt: 'desc' } });
  return ok(res, vendors);
});

const listShops = asyncHandler(async (req, res) => {
  const shops = await prisma.shop.findMany({ include: { vendor: { include: { user: true } }, _count: { select: { menuItems: true, orders: true } } } });
  return ok(res, shops);
});

const setUserActive = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await prisma.user.update({ where: { id: req.params.userId }, data: { isActive } });
  return ok(res, user, `User ${isActive ? 'activated' : 'deactivated'}`);
});

const approveShop = asyncHandler(async (req, res) => {
  const shop = await prisma.shop.update({ where: { id: req.params.shopId }, data: { isApproved: true } });
  return ok(res, shop, 'Shop approved');
});

/** Admin force-removes a shop regardless of active orders — for misuse/abuse cases. */
const forceRemoveShop = asyncHandler(async (req, res) => {
  const shop = await prisma.shop.update({
    where: { id: req.params.shopId },
    data: { isDeleted: true, isApproved: false, status: 'CLOSED' },
  });
  return ok(res, shop, 'Shop has been removed from the platform');
});

const restoreShop = asyncHandler(async (req, res) => {
  const shop = await prisma.shop.update({
    where: { id: req.params.shopId },
    data: { isDeleted: false, isApproved: true },
  });
  return ok(res, shop, 'Shop restored');
});

/** Platform-wide analytics computed from real data across every shop. */
const getPlatformAnalytics = asyncHandler(async (req, res) => {
  const [studentCount, vendorCount, shopCount, orderStats, revenueAgg] = await Promise.all([
    prisma.student.count(),
    prisma.vendor.count(),
    prisma.shop.count(),
    prisma.order.groupBy({ by: ['status'], _count: true }),
    prisma.order.aggregate({ where: { status: 'COMPLETED' }, _sum: { totalAmount: true } }),
  ]);

  return ok(res, {
    studentCount,
    vendorCount,
    shopCount,
    ordersByStatus: Object.fromEntries(orderStats.map((s) => [s.status, s._count])),
    totalPlatformRevenue: Number(revenueAgg._sum.totalAmount || 0),
  });
});

module.exports = { listStudents, listVendors, listShops, setUserActive, approveShop, forceRemoveShop, restoreShop, getPlatformAnalytics };
