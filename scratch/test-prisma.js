const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log("Connecting with Prisma...");
  try {
    const res = await prisma.$queryRaw`SELECT NOW()`;
    console.log("Result:", res);
    await prisma.$disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
