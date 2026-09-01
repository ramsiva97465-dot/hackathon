import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const teams = await prisma.team.findMany({
    where: {
      agentPhoneNumber: {
        not: null
      }
    },
    select: {
      id: true,
      name: true,
      agentName: true,
      agentPhoneNumber: true,
      projectTitle: true,
      tableNumber: true,
      round: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  // Filter out where agentPhoneNumber is 'N/A' or empty
  const validTeams = teams.filter(t => t.agentPhoneNumber && t.agentPhoneNumber !== 'N/A' && t.agentPhoneNumber.trim() !== '')

  console.log(`Total Teams with Agent Phone Numbers: ${validTeams.length}\n`)

  const results = validTeams.map((t, idx) => {
    const isRecentlyUpdated = t.updatedAt.getTime() - t.createdAt.getTime() > 1000 * 60 // updated > 1 minute after creation
    return {
      index: idx + 1,
      teamName: t.name,
      agentName: t.agentName,
      agentPhoneNumber: t.agentPhoneNumber,
      tableNumber: t.tableNumber,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      wasModifiedAfterCreation: isRecentlyUpdated,
      timeDiffMinutes: Math.round((t.updatedAt.getTime() - t.createdAt.getTime()) / (1000 * 60))
    }
  })

  console.log('--- RECENTLY UPDATED TEAMS (MOST RECENT FIRST) ---')
  console.log(JSON.stringify(results.slice(0, 25), null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
