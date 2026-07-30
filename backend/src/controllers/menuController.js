const prisma = require('../config/db');
const { ApiError, ok, created } = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/validate');
const inventoryService = require('../services/inventoryService');
const { emitInventoryUpdate } = require('../sockets');
const ocrService = require('../services/ocrService');
const { parseMenuText } = require('../services/menuExtractionService');

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

/**
 * AI Menu Photo Extraction: vendor uploads one photo of a physical menu
 * card/board -> OCR (Tesseract.js) pulls raw text -> heuristic parser
 * structures it into { name, price, category } suggestions. Nothing is
 * saved yet — the vendor reviews/edits these suggestions and confirms via
 * bulkCreateFromExtraction below, since OCR on real photos is never perfect.
 */
const extractMenuFromPhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No image file provided');

  const rawText = await ocrService.extractTextFromImage(req.file.path);
  const suggestions = parseMenuText(rawText);

  if (suggestions.length === 0) {
    throw new ApiError(422, "Couldn't detect any menu items in this photo. Try a clearer, well-lit photo, or add items manually.");
  }

  return ok(res, { suggestions, rawText }, `Found ${suggestions.length} possible item(s) — review before adding`);
});

/** Vendor confirms the (possibly edited) extracted list -> bulk-creates real menu items. */
const bulkCreateFromExtraction = asyncHandler(async (req, res) => {
  const shop = await getOwnedShopOrThrow(req.user.profileId);
  const { items } = req.body; // [{ name, price, category, openingStock?, lowStockThreshold? }]

  if (!Array.isArray(items) || items.length === 0) throw new ApiError(422, 'No items to add');

  const createdItems = [];
  for (const it of items) {
    if (!it.name || !it.price) continue;
    const stock = Number(it.openingStock) || 0;
    const menuItem = await prisma.menuItem.create({
      data: {
        shopId: shop.id,
        name: it.name,
        category: it.category || 'Menu',
        price: Number(it.price),
        prepTimeMinutes: Number(it.prepTimeMinutes) || 10,
        imageUrl: it.imageUrl || undefined,
        inventory: {
          create: { quantity: stock, openingStock: stock, lowStockThreshold: Number(it.lowStockThreshold) || 10 },
        },
      },
    });
    createdItems.push(menuItem);
  }

  return created(res, createdItems, `${createdItems.length} menu item(s) added from photo`);
});

module.exports = {
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  listMenuForShop,
  restockItem,
  setLowStockThreshold,
  extractMenuFromPhoto,
  bulkCreateFromExtraction,
};
