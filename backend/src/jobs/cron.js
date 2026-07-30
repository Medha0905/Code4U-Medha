const cron = require('node-cron');
const prisma = require('../config/db');
const queueService = require('../services/queueService');
const reportService = require('../services/reportService');
const sockets = require('../sockets');

/**
 * Runs every minute:
 *  - Automatic delay detection: if an order's estimated pickup time has
 *    passed while still PREPARING/ACCEPTED, recompute wait time & notify.
 *  - Auto-pause: shops with autoPauseEnabled get paused when kitchen load
 *    is HEAVY, and resumed automatically once load drops.
 */
function startCronJobs(io) {
  cron.schedule('* * * * *', async () => {
    try {
      const openShops = await prisma.shop.findMany({ where: { status: { in: ['OPEN', 'PAUSED'] } } });

      for (const shop of openShops) {
        const load = await queueService.getKitchenLoad(shop.id);
        sockets.emitKitchenLoad(io, shop.id, load);

        if (shop.autoPauseEnabled) {
          if (load.level === 'HEAVY' && shop.status !== 'PAUSED') {
            await prisma.shop.update({ where: { id: shop.id }, data: { status: 'PAUSED' } });
          } else if (load.level !== 'HEAVY' && shop.status === 'PAUSED') {
            await prisma.shop.update({ where: { id: shop.id }, data: { status: 'OPEN' } });
          }
        }

        // Delay detection: orders stuck past the vendor's own wait-bucket promise.
        // UNDER_20 -> flag if over 25 min elapsed (20 + 5 min grace); OVER_20 -> flag if over 45 min.
        const delayed = await prisma.queueEntry.findMany({
          where: {
            shopId: shop.id,
            leftAt: null,
            order: { status: { in: ['ACCEPTED', 'PREPARING'] } },
          },
          include: { order: { include: { student: true } } },
        });

        for (const entry of delayed) {
          const elapsedMinutes = (Date.now() - new Date(entry.enteredAt).getTime()) / 60000;
          const threshold = entry.order.waitBucket === 'OVER_20' ? 45 : 25;
          if (elapsedMinutes > threshold) {
            const notification = await prisma.notification.create({
              data: {
                userId: entry.order.student.userId,
                type: 'ORDER_DELAYED',
                title: 'Order Delayed',
                message: `Your order #${entry.order.tokenNumber} is taking longer than expected. Updated wait time is on the way.`,
              },
            });
            sockets.emitNotification(io, entry.order.student.userId, notification);
          }
        }

        const updatedQueue = await queueService.resequenceQueue(shop.id);
        if (updatedQueue.length) sockets.emitQueueUpdate(io, shop.id, updatedQueue);
      }
    } catch (err) {
      console.error('[cron] minute job error:', err.message);
    }
  });

  // End-of-day report generation, once daily at 23:55.
  cron.schedule('55 23 * * *', async () => {
    try {
      const shops = await prisma.shop.findMany();
      for (const shop of shops) {
        await reportService.generateDailyReport(shop.id, new Date());
      }
      console.log('[cron] End-of-day reports generated for all shops');
    } catch (err) {
      console.error('[cron] EOD report error:', err.message);
    }
  });
}

module.exports = { startCronJobs };
