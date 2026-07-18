const prisma = require('../config/db');
const { ApiError, ok, created } = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/validate');
const inventoryService = require('../services/inventoryService');
const { emitInventoryUpdate } = require('../sockets');

async function getOwnedShopOrThrow(vendorProfileId) {
  const shop = await prisma.shop.findUnique({ where: { vendorId: vendorProfileId } });
  if (!shop) throw new ApiError(404, 'Register your shop before managing a menu');
  return shop;
}

const addMenuItem = asyncHandler(async (req, res) => {
  const shop = await getOwnedShopOrThrow(req.user.profileId);
  const { name, description, category, price, prepTimeMinutes, imageUrl, openingStock, lowStockThreshold, customizations } = req.body;
  const stock = Number(openingStock) || 0;

  const menuItem = await prisma.menuItem.create({
    data: {
      shopId: shop.id,
      name,
      description,
      category,
      price,
      prepTimeMinutes: Number(prepTimeMinutes) || 10,
      imageUrl,
      customizations: customizations || undefined,
      inventory: {
        create: {
          quantity: stock,
          openingStock: stock,
          lowStockThreshold: Number(lowStockThreshold) || 10,
        },
      },
    },
    include: { inventory: true },
  });

  return created(res, menuItem, 'Menu item added');
});

const updateMenuItem = asyncHandler(async (req, res) => {
  const shop = await getOwnedShopOrThrow(req.user.profileId);
  const item = await prisma.menuItem.findFirst({ where: { id: req.params.id, shopId: shop.id } });
  if (!item) throw new ApiError(404, 'Menu item not found');

  const { name, description, category, price, prepTimeMinutes, imageUrl, isActive, customizations } = req.body;
  const updated = await prisma.menuItem.update({
    where: { id: item.id },
    data: { name, description, category, price, prepTimeMinutes, imageUrl, isActive, customizations },
  });

  return ok(res, updated, 'Menu item updated');
});

const deleteMenuItem = asyncHandler(async (req, res) => {
  const shop = await getOwnedShopOrThrow(req.user.profileId);
  const item = await prisma.menuItem.findFirst({ where: { id: req.params.id, shopId: shop.id } });
  if (!item) throw new ApiError(404, 'Menu item not found');

  await prisma.menuItem.delete({ where: { id: item.id } });
  return ok(res, null, 'Menu item deleted');
});

const listMenuForShop = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const { search, category, sort } = req.query;

  const orderBy =
    sort === 'price_asc' ? { price: 'asc' } :
    sort === 'price_desc' ? { price: 'desc' } :
    { createdAt: 'desc' };

  const items = await prisma.menuItem.findMany({
    where: {
      shopId,
      isActive: true,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      ...(category ? { category } : {}),
    },
    include: { inventory: true },
    orderBy,
  });

  return ok(res, items);
});

const restockItem = asyncHandler(async (req, res) => {
  const shop = await getOwnedShopOrThrow(req.user.profileId);
  const item = await prisma.menuItem.findFirst({ where: { id: req.params.id, shopId: shop.id } });
  if (!item) throw new ApiError(404, 'Menu item not found');

  const { addQuantity } = req.body;
  const result = await inventoryService.restock(item.id, Number(addQuantity));

  const io = req.app.get('io');
  emitInventoryUpdate(io, shop.id, { menuItemId: item.id, ...result });

  return ok(res, result, 'Stock updated');
});

const setLowStockThreshold = asyncHandler(async (req, res) => {
  const shop = await getOwnedShopOrThrow(req.user.profileId);
  const item = await prisma.menuItem.findFirst({ where: { id: req.params.id, shopId: shop.id }, include: { inventory: true } });
  if (!item) throw new ApiError(404, 'Menu item not found');

  const { lowStockThreshold } = req.body;
  const updated = await prisma.inventory.update({
    where: { menuItemId: item.id },
    data: { lowStockThreshold },
  });

  return ok(res, updated, 'Low stock threshold updated');
});

module.exports = {
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  listMenuForShop,
  restockItem,
  setLowStockThreshold,
};
