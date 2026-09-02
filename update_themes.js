const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.homepageSetting.updateMany({
    where: {
      bgColor: "#0F172A"
    },
    data: {
      bgColor: "#FFFFFF",
      primaryColor: "#2075BC",
      secondaryColor: "#119398",
      heroBgUrl: ""
    }
  });
  console.log(`Updated ${result.count} homepage settings to light theme.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
