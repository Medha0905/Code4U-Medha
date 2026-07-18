const prisma = require('../config/db');
const { ApiError, ok, created } = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/validate');

const createShop = asyncHandler(async (req, res) => {
  const existing = await prisma.shop.findUnique({ where: { vendorId: req.user.profileId } });
  if (existing) throw new ApiError(409, 'You have already registered a shop');

  const { name, description, location, categories, contactPhone, contactEmail, openingTime, closingTime, logoUrl } = req.body;

  const shop = await prisma.shop.create({
    data: {
      vendorId: req.user.profileId,
      name,
      description,
      location,
      categories: categories || [],
      contactPhone,
      contactEmail,
      openingTime,
      closingTime,
      logoUrl,
    },
  });

  return created(res, shop, 'Shop registered successfully');
});

const updateMyShop = asyncHandler(async (req, res) => {
  const shop = await prisma.shop.findUnique({ where: { vendorId: req.user.profileId } });
  if (!shop) throw new ApiError(404, 'Shop not found — register your shop first');

  const updated = await prisma.shop.update({
    where: { id: shop.id },
    data: req.body,
  });

  return ok(res, updated, 'Shop updated');
});

const getMyShop = asyncHandler(async (req, res) => {
  const shop = await prisma.shop.findUnique({
    where: { vendorId: req.user.profileId },
    include: { menuItems: { include: { inventory: true } } },
  });
  if (!shop) throw new ApiError(404, 'Shop not found — register your shop first');
  return ok(res, shop);
});

const toggleShopStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // OPEN | CLOSED
  const shop = await prisma.shop.findUnique({ where: { vendorId: req.user.profileId } });
  if (!shop) throw new ApiError(404, 'Shop not found');

  const updated = await prisma.shop.update({ where: { id: shop.id }, data: { status } });
  return ok(res, updated, `Shop is now ${status}`);
});

const updateSeatStatus = asyncHandler(async (req, res) => {
  const { seatStatus } = req.body;
  const shop = await prisma.shop.findUnique({ where: { vendorId: req.user.profileId } });
  if (!shop) throw new ApiError(404, 'Shop not found');

  const updated = await prisma.shop.update({ where: { id: shop.id }, data: { seatStatus } });

  const io = req.app.get('io');
  const { emitSeatStatus } = require('../sockets');
  emitSeatStatus(io, shop.id, seatStatus);

  return ok(res, updated, 'Seat availability updated');
});

const listShops = asyncHandler(async (req, res) => {
  const { search, category } = req.query;
  const shops = await prisma.shop.findMany({
    where: {
      isApproved: true,
      isDeleted: false,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      ...(category ? { categories: { has: category } } : {}),
    },
    include: { _count: { select: { menuItems: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const ratings = await prisma.review.groupBy({
    by: ['shopId'],
    where: { shopId: { in: shops.map((s) => s.id) } },
    _avg: { rating: true },
    _count: true,
  });
  const ratingByShop = Object.fromEntries(ratings.map((r) => [r.shopId, { avgRating: r._avg.rating, reviewCount: r._count }]));

  return ok(res, shops.map((s) => ({ ...s, ...(ratingByShop[s.id] || { avgRating: null, reviewCount: 0 }) })));
});

const getShopById = asyncHandler(async (req, res) => {
  const shop = await prisma.shop.findFirst({
    where: { id: req.params.id, isDeleted: false },
    include: { menuItems: { where: { isActive: true }, include: { inventory: true } } },
  });
  if (!shop) throw new ApiError(404, 'Shop not found');

  const agg = await prisma.review.aggregate({ where: { shopId: shop.id }, _avg: { rating: true }, _count: true });
  return ok(res, { ...shop, avgRating: agg._avg.rating, reviewCount: agg._count });
});

/** Vendor removes their shop from the platform. Soft-delete: hides it from students
 * immediately and blocks new orders, but preserves order/analytics history rather
 * than destructively cascading deletes through completed orders. */
const deleteMyShop = asyncHandler(async (req, res) => {
  const shop = await prisma.shop.findUnique({ where: { vendorId: req.user.profileId } });
  if (!shop) throw new ApiError(404, 'Shop not found');

  const activeOrders = await prisma.order.count({
    where: { shopId: shop.id, status: { in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'] } },
  });
  if (activeOrders > 0) {
    throw new ApiError(409, `You still have ${activeOrders} active order(s). Complete or cancel them before removing your shop.`);
  }

  await prisma.shop.update({
    where: { id: shop.id },
    data: { isDeleted: true, status: 'CLOSED' },
  });

  return ok(res, null, 'Your shop has been removed from the platform');
});

module.exports = {
  createShop,
  updateMyShop,
  getMyShop,
  toggleShopStatus,
  updateSeatStatus,
  listShops,
  getShopById,
  deleteMyShop,
};
