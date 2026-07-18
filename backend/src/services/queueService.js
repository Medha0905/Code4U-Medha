const prisma = require('../config/db');

/**
 * AI Wait-Time Prediction
 * Estimates minutes until an order is ready based on:
 *  - number of active orders ahead in the shop's queue
 *  - average prep time of items in this order
 *  - current kitchen load (pending + preparing orders)
 * This is a deterministic, explainable model (not a black box), which keeps
 * predictions auditable — it can later be swapped for a trained model without
 * changing the calling code.
 */
async function predictWaitMinutes(shopId, itemPrepTimes) {
  const activeOrders = await prisma.order.count({
    where: { shopId, status: { in: ['PLACED', 'ACCEPTED', 'PREPARING'] } },
  });

  const avgPrepTime = itemPrepTimes.length
    ? itemPrepTimes.reduce((a, b) => a + b, 0) / itemPrepTimes.length
    : 10;

  // Each order ahead adds a slice of parallel kitchen throughput (assume shop
  // can work ~2 orders in parallel), plus this order's own prep time.
  const parallelismFactor = 2;
  const queueDelay = Math.ceil(activeOrders / parallelismFactor) * 4; // 4 min avg per batch
  const estimate = Math.round(queueDelay + avgPrepTime);

  return Math.max(estimate, Math.round(avgPrepTime));
}

/**
 * Kitchen Load Indicator: LOW / MEDIUM / HEAVY
 * Based on pending + preparing order counts relative to shop's recent throughput.
 */
async function getKitchenLoad(shopId) {
  const [pending, preparing] = await Promise.all([
    prisma.order.count({ where: { shopId, status: { in: ['PLACED', 'ACCEPTED'] } } }),
    prisma.order.count({ where: { shopId, status: 'PREPARING' } }),
  ]);

  const activeLoad = pending + preparing;
  let level = 'LOW';
  if (activeLoad >= 15) level = 'HEAVY';
  else if (activeLoad >= 6) level = 'MEDIUM';

  return { level, pending, preparing };
}

/**
 * Assigns the next queue position for a shop (max existing position + 1
 * among still-active queue entries).
 */
async function nextQueuePosition(shopId) {
  const last = await prisma.queueEntry.findFirst({
    where: { shopId, leftAt: null },
    orderBy: { position: 'desc' },
  });
  return (last?.position || 0) + 1;
}

/**
 * Re-sequences the live queue for a shop after an order leaves it
 * (completed/cancelled), shifting everyone below up by one and
 * recalculating estimated wait times. Returns updated queue for broadcast.
 */
async function resequenceQueue(shopId) {
  const remaining = await prisma.queueEntry.findMany({
    where: { shopId, leftAt: null },
    orderBy: { position: 'asc' },
    include: { order: { include: { items: { include: { menuItem: true } } } } },
  });

  const updates = [];
  for (let i = 0; i < remaining.length; i++) {
    const entry = remaining[i];
    const newPosition = i + 1;
    const prepTimes = entry.order.items.map((it) => it.menuItem.prepTimeMinutes);
    const waitMinutes = await predictWaitMinutes(shopId, prepTimes);

    if (entry.position !== newPosition || entry.estimatedWaitMinutes !== waitMinutes) {
      await prisma.queueEntry.update({
        where: { id: entry.id },
        data: { position: newPosition, estimatedWaitMinutes: waitMinutes },
      });
    }
    updates.push({ ...entry, position: newPosition, estimatedWaitMinutes: waitMinutes });
  }

  return updates;
}

/** Batch cooking suggestions: groups pending/accepted items by name with counts. */
async function getBatchCookingSuggestions(shopId) {
  const items = await prisma.orderItem.findMany({
    where: {
      order: { shopId, status: { in: ['PLACED', 'ACCEPTED', 'PREPARING'] } },
    },
    include: { menuItem: true },
  });

  const grouped = {};
  for (const item of items) {
    const key = item.menuItem.name;
    grouped[key] = (grouped[key] || 0) + item.quantity;
  }

  return Object.entries(grouped)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity);
}

module.exports = {
  predictWaitMinutes,
  getKitchenLoad,
  nextQueuePosition,
  resequenceQueue,
  getBatchCookingSuggestions,
};
