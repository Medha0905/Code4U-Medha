const prisma = require('../config/db');
const PDFDocument = require('pdfkit');

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Generates (or regenerates) the end-of-day report for a shop from real orders. */
async function generateDailyReport(shopId, date = new Date()) {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const orders = await prisma.order.findMany({
    where: { shopId, status: 'COMPLETED', completedAt: { gte: dayStart, lte: dayEnd } },
    include: { items: { include: { menuItem: true } }, queueEntry: true },
  });

  const productWiseSales = {};
  let totalRevenue = 0;
  const hourCounts = Array(24).fill(0);
  let totalWait = 0;
  let waitCount = 0;

  for (const order of orders) {
    totalRevenue += Number(order.totalAmount);
    hourCounts[new Date(order.completedAt).getHours()] += 1;

    for (const item of order.items) {
      const key = item.menuItemId;
      if (!productWiseSales[key]) {
        productWiseSales[key] = { name: item.menuItem.name, qty: 0, revenue: 0 };
      }
      productWiseSales[key].qty += item.quantity;
      productWiseSales[key].revenue += item.quantity * Number(item.unitPrice);
    }

    if (order.queueEntry?.enteredAt) {
      const measuredMinutes = (new Date(order.completedAt).getTime() - new Date(order.queueEntry.enteredAt).getTime()) / 60000;
      totalWait += measuredMinutes;
      waitCount += 1;
    }
  }

  const sorted = Object.values(productWiseSales).sort((a, b) => b.qty - a.qty);
  const bestSelling = sorted[0]?.name || null;
  const leastSelling = sorted[sorted.length - 1]?.name || null;
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

  const remainingInventory = await prisma.inventory.findMany({
    where: { menuItem: { shopId } },
    include: { menuItem: true },
  });

  const report = await prisma.dailyReport.upsert({
    where: { shopId_reportDate: { shopId, reportDate: dayStart } },
    update: {
      totalOrders: orders.length,
      totalRevenue,
      bestSellingItemId: sorted[0] ? Object.keys(productWiseSales).find((k) => productWiseSales[k].name === bestSelling) : null,
      leastSellingItemId: sorted[sorted.length - 1] ? Object.keys(productWiseSales).find((k) => productWiseSales[k].name === leastSelling) : null,
      peakHour,
      avgWaitMinutes: waitCount ? totalWait / waitCount : null,
      productWiseSales,
    },
    create: {
      shopId,
      reportDate: dayStart,
      totalOrders: orders.length,
      totalRevenue,
      peakHour,
      avgWaitMinutes: waitCount ? totalWait / waitCount : null,
      productWiseSales,
    },
  });

  return { ...report, bestSelling, leastSelling, remainingInventory };
}

/** Streams a PDF version of a generated report. */
function streamReportPdf(res, shop, report) {
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="report-${shop.name}-${report.reportDate.toISOString().slice(0, 10)}.pdf"`);
  doc.pipe(res);

  doc.fontSize(20).text(`${shop.name} — End of Day Report`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Date: ${new Date(report.reportDate).toDateString()}`);
  doc.text(`Total Orders: ${report.totalOrders}`);
  doc.text(`Total Revenue: ₹${Number(report.totalRevenue).toFixed(2)}`);
  doc.text(`Best Selling Item: ${report.bestSelling || 'N/A'}`);
  doc.text(`Least Selling Item: ${report.leastSelling || 'N/A'}`);
  doc.text(`Peak Selling Hour: ${report.peakHour ?? 'N/A'}:00`);
  doc.text(`Average Wait Time: ${report.avgWaitMinutes ? report.avgWaitMinutes.toFixed(1) : 'N/A'} minutes`);
  doc.moveDown();

  doc.fontSize(14).text('Product-wise Sales', { underline: true });
  doc.moveDown(0.5);
  Object.values(report.productWiseSales || {}).forEach((p) => {
    doc.fontSize(11).text(`${p.name}  —  ${p.qty} sold  —  ₹${p.revenue.toFixed(2)}`);
  });

  doc.moveDown();
  doc.fontSize(14).text('Remaining Inventory', { underline: true });
  doc.moveDown(0.5);
  (report.remainingInventory || []).forEach((inv) => {
    doc.fontSize(11).text(`${inv.menuItem.name}  —  ${inv.quantity} left`);
  });

  doc.end();
}

module.exports = { generateDailyReport, streamReportPdf };
