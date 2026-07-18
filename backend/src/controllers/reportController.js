const prisma = require('../config/db');
const { ApiError, ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/validate');
const reportService = require('../services/reportService');

/** Vendor analytics dashboard — all figures computed live from real orders. */
const getVendorAnalytics = asyncHandler(async (req, res) => {
  const shop = await prisma.shop.findUnique({ where: { vendorId: req.user.profileId } });
  if (!shop) throw new ApiError(404, 'Shop not found');

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
  const monthStart = new Date(now); monthStart.setDate(now.getDate() - 30);

  const [todayOrders, weekOrders, monthOrders, allCompleted, queueEntries] = await Promise.all([
    prisma.order.findMany({ where: { shopId: shop.id, status: 'COMPLETED', completedAt: { gte: todayStart } } }),
    prisma.order.aggregate({ where: { shopId: shop.id, status: 'COMPLETED', completedAt: { gte: weekStart } }, _sum: { totalAmount: true }, _count: true }),
    prisma.order.aggregate({ where: { shopId: shop.id, status: 'COMPLETED', completedAt: { gte: monthStart } }, _sum: { totalAmount: true }, _count: true }),
    prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: { order: { shopId: shop.id, status: 'COMPLETED' } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
    }),
    prisma.queueEntry.findMany({ where: { shopId: shop.id, leftAt: { not: null } }, select: { estimatedWaitMinutes: true } }),
  ]);

  const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const avgWait = queueEntries.length
    ? queueEntries.reduce((s, q) => s + q.estimatedWaitMinutes, 0) / queueEntries.length
    : 0;

  const hourCounts = Array(24).fill(0);
  todayOrders.forEach((o) => hourCounts[new Date(o.completedAt).getHours()]++);
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts, 0));

  const menuItemIds = allCompleted.map((c) => c.menuItemId);
  const menuItems = await prisma.menuItem.findMany({ where: { id: { in: menuItemIds } } });
  const nameById = Object.fromEntries(menuItems.map((m) => [m.id, m.name]));

  const productWiseSales = allCompleted.map((c) => ({ name: nameById[c.menuItemId], sold: c._sum.quantity }));

  return ok(res, {
    todayRevenue,
    todayOrders: todayOrders.length,
    weeklyRevenue: Number(weekOrders._sum.totalAmount || 0),
    weeklyOrders: weekOrders._count,
    monthlyRevenue: Number(monthOrders._sum.totalAmount || 0),
    monthlyOrders: monthOrders._count,
    avgWaitMinutes: Number(avgWait.toFixed(1)),
    peakHour,
    mostPopular: productWiseSales[0]?.name || null,
    leastPopular: productWiseSales[productWiseSales.length - 1]?.name || null,
    productWiseSales,
  });
});

const getDailyReport = asyncHandler(async (req, res) => {
  const shop = await prisma.shop.findUnique({ where: { vendorId: req.user.profileId } });
  if (!shop) throw new ApiError(404, 'Shop not found');

  const date = req.query.date ? new Date(req.query.date) : new Date();
  const report = await reportService.generateDailyReport(shop.id, date);
  return ok(res, report);
});

const downloadDailyReportPdf = asyncHandler(async (req, res) => {
  const shop = await prisma.shop.findUnique({ where: { vendorId: req.user.profileId } });
  if (!shop) throw new ApiError(404, 'Shop not found');

  const date = req.query.date ? new Date(req.query.date) : new Date();
  const report = await reportService.generateDailyReport(shop.id, date);
  reportService.streamReportPdf(res, shop, report);
});

module.exports = { getVendorAnalytics, getDailyReport, downloadDailyReportPdf };
