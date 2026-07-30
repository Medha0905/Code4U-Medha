const prisma = require('../config/db');

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
 * (completed/cancelled), shifting everyone below up by one. Wait-time is no
 * longer algorithmically estimated here — the vendor sets a wait bucket
 * ("under 20 min" / "20+ min") directly on the Order when they click Accept,
 * since the vendor has real visibility into kitchen parallelism and walk-in
 * load that no formula can see. This function only manages queue ordering.
 */
async function resequenceQueue(shopId) {
  const remaining = await prisma.queueEntry.findMany({
    where: { shopId, leftAt: null },
    orderBy: { position: 'asc' },
    include: { order: true },
  });

  const updates = [];
  for (let i = 0; i < remaining.length; i++) {
    const entry = remaining[i];
    const newPosition = i + 1;

    if (entry.position !== newPosition) {
      await prisma.queueEntry.update({
        where: { id: entry.id },
        data: { position: newPosition },
      });
    }
    updates.push({ ...entry, position: newPosition });
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
  getKitchenLoad,
  nextQueuePosition,
  resequenceQueue,
  getBatchCookingSuggestions,
};
