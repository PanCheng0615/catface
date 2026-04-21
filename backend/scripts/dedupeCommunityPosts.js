require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { cleanupConsecutiveDuplicatePosts } = require('../src/services/community-dedup.service.js');

const prisma = new PrismaClient();

async function main() {
  const summary = await cleanupConsecutiveDuplicatePosts(prisma);
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
