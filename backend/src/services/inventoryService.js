const prisma = require('../config/db');

/**
 * Tiers scale with the item's own opening stock (not a flat multiple of the
 * low-stock threshold) so "Limited Stock" reflects real depletion instead of
 * firing early on items that were stocked high or low to begin with.
 *   SOLD_OUT        quantity <= 0
 *   ALMOST_FINISHED quantity <= lowStockThreshold
 *   LIMITED         quantity <= 40% of opening stock (and above threshold)
 *   AVAILABLE       everything else
 */
function availabilityFromQuantity(quantity, threshold, openingStock = 0) {
  if (quantity <= 0) return 'SOLD_OUT';
  if (quantity <= threshold) return 'ALMOST_FINISHED';
  const limitedCutoff = Math.max(openingStock * 0.4, threshold + 1);
  if (quantity <= limitedCutoff) return 'LIMITED';
  return 'AVAILABLE';
}

/**
 * Deducts stock for every item in an order (inside the same transaction the
 * order is created in). Automatically flips availability to SOLD_OUT when a
 * quantity hits zero, and emits low-stock notifications for the vendor.
 * Throws if any item does not have enough stock (prevents overselling).
 */
async function deductStockForOrder(tx, orderItems, io) {
  const lowStockAlerts = [];

  for (const item of orderItems) {
    const inventory = await tx.inventory.findUnique({
      where: { menuItemId: item.menuItemId },
      include: { menuItem: { include: { shop: true } } },
    });

    if (!inventory || inventory.quantity < item.quantity) {
      const name = inventory?.menuItem?.name || 'Item';
      const err = new Error(`${name} does not have enough stock available`);
      err.statusCode = 409;
      throw err;
    }

    const newQuantity = inventory.quantity - item.quantity;
    const availability = availabilityFromQuantity(newQuantity, inventory.lowStockThreshold, inventory.openingStock);

    await tx.inventory.update({
      where: { id: inventory.id },
      data: { quantity: newQuantity },
    });

    await tx.menuItem.update({
      where: { id: item.menuItemId },
      data: { availability },
    });

    if (newQuantity <= inventory.lowStockThreshold) {
      lowStockAlerts.push({
        shopId: inventory.menuItem.shopId,
        vendorUserId: inventory.menuItem.shop.vendorId,
        itemName: inventory.menuItem.name,
        remaining: newQuantity,
      });
    }
  }

  return lowStockAlerts;
}

/**
 * Vendor restocking - increases quantity instantly and flips availability
 * back to AVAILABLE/LIMITED as appropriate.
 */
async function restock(menuItemId, addQuantity) {
  const inventory = await prisma.inventory.findUnique({ where: { menuItemId } });
  if (!inventory) throw Object.assign(new Error('Inventory record not found'), { statusCode: 404 });

  const newQuantity = inventory.quantity + addQuantity;
  // Restocking raises the opening-stock baseline too, so tiers stay meaningful.
  const newOpeningStock = Math.max(inventory.openingStock, newQuantity);
  const availability = availabilityFromQuantity(newQuantity, inventory.lowStockThreshold, newOpeningStock);

  await prisma.inventory.update({ where: { id: inventory.id }, data: { quantity: newQuantity, openingStock: newOpeningStock } });
  await prisma.menuItem.update({ where: { id: menuItemId }, data: { availability } });

  return { quantity: newQuantity, availability };
}

module.exports = { deductStockForOrder, restock, availabilityFromQuantity };
