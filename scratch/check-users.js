const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { username: true, role: true }
  });
  console.log("Users in database:");
  users.forEach(u => console.log(`- ${u.username} (${u.role})`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
