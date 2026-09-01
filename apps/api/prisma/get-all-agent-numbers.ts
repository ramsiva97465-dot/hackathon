import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const allTeams = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
      agentName: true,
      agentPhoneNumber: true,
      projectTitle: true,
      tableNumber: true,
      round: true,
      application: {
        select: {
          projectTitle: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })

  // Filter teams that have a valid agentPhoneNumber or submitted details
  const teamsWithAgent = allTeams.filter(t => 
    (t.agentPhoneNumber && t.agentPhoneNumber !== 'N/A' && t.agentPhoneNumber.trim() !== '') ||
    (t.agentName && t.agentName !== 'N/A' && t.agentName.trim() !== '') ||
    (t.projectTitle && t.projectTitle !== 'N/A' && t.projectTitle.trim() !== '')
  )

  console.log(`Total Teams in DB: ${allTeams.length}`)
  console.log(`Total Submitted Teams with Agent Number: ${teamsWithAgent.length}`)
  console.log(JSON.stringify(teamsWithAgent, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
