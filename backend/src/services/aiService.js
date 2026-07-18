const prisma = require('../config/db');
const { getKitchenLoad, getBatchCookingSuggestions } = require('./queueService');

/**
 * All "AI" features here are computed directly from real order data stored
 * in PostgreSQL — no hardcoded or fake outputs. They are rule-based /
 * statistical models, which keeps them transparent, fast, and fully
 * explainable from the underlying rows. This module is the single seam
 * where a trained ML model could later be swapped in.
 */

/** Frequently ordered + favorite + popular recommendations for a student. */
async function getRecommendationsForStudent(studentId, shopId) {
  const [frequentlyOrdered, favorites, popular] = await Promise.all([
    prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: { order: { studentId, shopId, status: 'COMPLETED' } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    prisma.favorite.findMany({ where: { studentId, menuItem: { shopId } }, include: { menuItem: true } }),
    prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: { order: { shopId, status: 'COMPLETED' } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ]);

  const ids = new Set([
    ...frequentlyOrdered.map((f) => f.menuItemId),
    ...popular.map((p) => p.menuItemId),
  ]);
  const items = await prisma.menuItem.findMany({ where: { id: { in: [...ids] } } });
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));

  return {
    frequentlyOrdered: frequentlyOrdered.map((f) => byId[f.menuItemId]).filter(Boolean),
    favorites: favorites.map((f) => f.menuItem),
    popular: popular.map((p) => byId[p.menuItemId]).filter(Boolean),
  };
}

/** AI Kitchen Assistant - actionable, real-time suggestions for the vendor. */
async function getKitchenAssistantSuggestions(shopId) {
  const [batch, load, upcomingBulk, priorityOrder] = await Promise.all([
    getBatchCookingSuggestions(shopId),
    getKitchenLoad(shopId),
    prisma.bulkOrder.findMany({
      where: { shopId, eventDate: { gte: new Date() } },
      orderBy: { eventDate: 'asc' },
      take: 3,
    }),
    prisma.order.findFirst({
      where: { shopId, status: { in: ['PLACED', 'ACCEPTED'] } },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const suggestions = batch.map((b) => `Prepare ${b.name} ×${b.quantity}`);
  if (priorityOrder) suggestions.push(`Priority order: Token #${priorityOrder.tokenNumber}`);
  if (upcomingBulk.length) {
    suggestions.push(`Upcoming bulk order for ${upcomingBulk[0].numberOfPeople} people — plan ahead`);
  }

  const efficiency = load.level === 'HEAVY' ? 'Needs Attention' : load.level === 'MEDIUM' ? 'Good' : 'Excellent';

  return { batchCooking: batch, kitchenLoad: load, suggestions, efficiency };
}

/**
 * AI Business Insights — statistical patterns mined from the shop's own
 * historical order data (day-of-week demand, hourly demand curve).
 */
async function getBusinessInsights(shopId) {
  const completedOrders = await prisma.order.findMany({
    where: { shopId, status: 'COMPLETED', completedAt: { not: null } },
    include: { items: { include: { menuItem: true } } },
  });

  if (completedOrders.length < 5) {
    return { insights: ['Not enough historical order data yet — insights improve as more orders complete.'] };
  }

  const dayTotals = Array(7).fill(0);
  const hourTotals = Array(24).fill(0);
  const itemDemandByHour = {};

  for (const order of completedOrders) {
    const d = new Date(order.completedAt);
    dayTotals[d.getDay()] += 1;
    hourTotals[d.getHours()] += 1;
    for (const item of order.items) {
      itemDemandByHour[item.menuItem.name] = itemDemandByHour[item.menuItem.name] || Array(24).fill(0);
      itemDemandByHour[item.menuItem.name][d.getHours()] += item.quantity;
    }
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const busiestDay = dayNames[dayTotals.indexOf(Math.max(...dayTotals))];
  const peakHour = hourTotals.indexOf(Math.max(...hourTotals));

  const insights = [
    `${busiestDay} is your busiest day based on completed orders.`,
    `Demand peaks around ${peakHour}:00 — consider extra staff during this window.`,
  ];

  for (const [name, hours] of Object.entries(itemDemandByHour)) {
    const afternoonDemand = hours.slice(16, 20).reduce((a, b) => a + b, 0);
    const totalDemand = hours.reduce((a, b) => a + b, 0);
    if (totalDemand > 0 && afternoonDemand / totalDemand > 0.4) {
      insights.push(`${name} demand rises after 4 PM.`);
    }
  }

  return { insights, busiestDay, peakHour };
}

module.exports = { getRecommendationsForStudent, getKitchenAssistantSuggestions, getBusinessInsights };
