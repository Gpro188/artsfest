const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const events = await prisma.event.findMany({
    select: {
      id: true,
      name: true,
      parentId: true,
      _count: {
        select: { teams: true, programs: true }
      }
    }
  })
  console.dir(events, { depth: null })
  
  const totalTeams = await prisma.team.count()
  const totalPrograms = await prisma.program.count()
  console.log('Total teams:', totalTeams)
  console.log('Total programs:', totalPrograms)
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
