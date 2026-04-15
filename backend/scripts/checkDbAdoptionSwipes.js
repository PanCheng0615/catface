/**
 * Quick check: adoption_swipes table exists (Phase A2).
 * Run: node scripts/checkDbAdoptionSwipes.js
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'adoption_swipes'
    ) AS exists
  `;
  const ok = rows && rows[0] && rows[0].exists === true;
  console.log(ok ? 'OK: table public.adoption_swipes exists' : 'MISSING: public.adoption_swipes — run prisma migrate deploy');
  if (!ok) process.exitCode = 1;

  if (ok && prisma.adoptionSwipe) {
    const n = await prisma.adoptionSwipe.count();
    console.log('AdoptionSwipe rows:', n);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma['$disconnect']();
  });
