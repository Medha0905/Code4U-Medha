/**
 * This seed script intentionally creates NOTHING but the first Admin
 * account. Per project requirements there is no fake student, vendor,
 * shop, menu, or order data — every one of those is created through real
 * registration and usage of the running application.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  const fullName = process.env.ADMIN_SEED_NAME || 'Platform Admin';

  if (!email || !password) {
    console.log('ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD not set — skipping admin seed.');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Admin account already exists, skipping.');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'ADMIN',
      admin: { create: { fullName } },
    },
  });

  console.log(`Admin account created for ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
