const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Querying database...");
  const events = await prisma.event.findMany();
  console.log("Events found:", events.length);
  const settings = await prisma.globalSetting.findFirst();
  console.log("Settings found:", settings ? "Yes" : "No");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
