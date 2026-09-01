import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const teams = await prisma.team.findMany({
    include: {
      members: true,
      application: true,
      scoreSheets: true
    }
  })

  // Filter teams that submitted a project
  const submittedTeams = teams.filter(t => 
    (t.projectTitle && t.projectTitle !== 'N/A') || 
    (t.agentName && t.agentName !== 'N/A') ||
    (t.demoUrl && t.demoUrl !== 'N/A') ||
    (t.githubUrl && t.githubUrl !== 'N/A') ||
    (t.agentPhoneNumber && t.agentPhoneNumber !== 'N/A') ||
    (t.application?.projectTitle && t.application.projectTitle !== 'N/A')
  )

  let totalMembersInSubmitted = 0
  const allEmails = new Set<string>()

  const list = submittedTeams.map((t, idx) => {
    totalMembersInSubmitted += t.members.length
    t.members.forEach(m => allEmails.add(m.email.toLowerCase().trim()))

    return {
      sNo: idx + 1,
      teamName: t.name,
      memberCount: t.members.length,
      members: t.members.map(m => `${m.name} (${m.email})`).join(', '),
      projectTitle: t.projectTitle || t.application?.projectTitle || 'N/A',
      agentPhone: t.agentPhoneNumber || 'N/A'
    }
  })

  console.log(JSON.stringify({
    totalSubmittedTeams: submittedTeams.length,
    totalMembersInSubmittedTeams: totalMembersInSubmitted,
    uniquePersonsInSubmittedTeams: allEmails.size,
    teamList: list
  }, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
