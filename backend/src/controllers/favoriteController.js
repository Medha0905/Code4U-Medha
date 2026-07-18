const prisma = require('../config/db');
const { ApiError, ok, created } = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/validate');

const addFavorite = asyncHandler(async (req, res) => {
  const { menuItemId } = req.body;
  const existing = await prisma.favorite.findUnique({
    where: { studentId_menuItemId: { studentId: req.user.profileId, menuItemId } },
  });
  if (existing) throw new ApiError(409, 'Already in favorites');

  const favorite = await prisma.favorite.create({ data: { studentId: req.user.profileId, menuItemId } });
  return created(res, favorite, 'Added to favorites');
});

const removeFavorite = asyncHandler(async (req, res) => {
  await prisma.favorite.delete({
    where: { studentId_menuItemId: { studentId: req.user.profileId, menuItemId: req.params.menuItemId } },
  });
  return ok(res, null, 'Removed from favorites');
});

const listFavorites = asyncHandler(async (req, res) => {
  const favorites = await prisma.favorite.findMany({
    where: { studentId: req.user.profileId },
    include: { menuItem: { include: { shop: true, inventory: true } } },
  });
  return ok(res, favorites);
});

module.exports = { addFavorite, removeFavorite, listFavorites };
