const prisma = require('../config/db');

/**
 * Checks whether a student is currently allowed to place a COD order at a
 * given shop. Blocking is always scoped to (student, shop) — never the
 * student's whole account.
 */
async function isCodAllowed(studentId, shopId) {
  const strike = await prisma.codStrike.findUnique({ where: { studentId_shopId: { studentId, shopId } } });
  if (!strike) return { allowed: true };

  if (strike.codBlockedPermanently) {
    return { allowed: false, reason: 'COD has been disabled for this shop due to repeated no-shows.' };
  }
  if (strike.codBlockedUntil && strike.codBlockedUntil > new Date()) {
    return {
      allowed: false,
      reason: `COD is temporarily disabled for this shop until ${strike.codBlockedUntil.toDateString()}.`,
    };
  }
  return { allowed: true };
}

/**
 * Records a no-show for a COD order and escalates the penalty:
 *  1st no-show -> warning only
 *  2nd no-show -> COD disabled for this shop for 7 days
 *  3rd+ no-show -> COD permanently disabled for this shop
 * Prepaid orders and the student's other shop relationships are unaffected.
 */
async function recordNoShow(studentId, shopId) {
  const strike = await prisma.codStrike.upsert({
    where: { studentId_shopId: { studentId, shopId } },
    update: { strikeCount: { increment: 1 } },
    create: { studentId, shopId, strikeCount: 1 },
  });

  let update = {};
  let message = 'Warning: missing pickup on a Cash on Delivery order affects your COD eligibility at this shop.';

  if (strike.strikeCount === 2) {
    const until = new Date();
    until.setDate(until.getDate() + 7);
    update = { codBlockedUntil: until };
    message = 'Your Cash on Delivery option has been disabled for this shop for 7 days due to repeated no-shows.';
  } else if (strike.strikeCount >= 3) {
    update = { codBlockedPermanently: true };
    message = 'Your Cash on Delivery option has been permanently disabled for this shop. You can still place prepaid orders.';
  }

  if (Object.keys(update).length) {
    await prisma.codStrike.update({ where: { id: strike.id }, data: update });
  }

  return { strikeCount: strike.strikeCount, message };
}

module.exports = { isCodAllowed, recordNoShow };
