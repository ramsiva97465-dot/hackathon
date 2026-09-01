import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const teams = await prisma.team.findMany({
    include: {
      members: true,
      application: true,
      track: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  // Filter submitted teams
  const submittedTeams = teams.filter(t => 
    (t.projectTitle && t.projectTitle !== 'N/A') || 
    (t.agentName && t.agentName !== 'N/A') ||
    (t.demoUrl && t.demoUrl !== 'N/A') ||
    (t.githubUrl && t.githubUrl !== 'N/A') ||
    (t.agentPhoneNumber && t.agentPhoneNumber !== 'N/A') ||
    (t.application?.projectTitle && t.application.projectTitle !== 'N/A')
  )

  let participantIndex = 1
  const participantList: any[] = []

  submittedTeams.forEach((t, tIdx) => {
    t.members.forEach((m, mIdx) => {
      participantList.push({
        sNo: participantIndex++,
        teamIndex: tIdx + 1,
        teamName: t.name,
        tableNumber: t.tableNumber || `Table ${tIdx + 1}`,
        participantName: m.name,
        participantEmail: m.email,
        role: m.role || (mIdx === 0 ? 'Leader' : 'Member'),
        projectTitle: t.projectTitle || t.application?.projectTitle || 'N/A',
        agentName: t.agentName || 'N/A',
        agentPhone: t.agentPhoneNumber || 'N/A'
      })
    })
  })

  console.log(JSON.stringify(participantList, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
