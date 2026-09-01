import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const teams = await prisma.team.findMany({
    include: {
      track: true,
      members: true,
      application: true,
      scoreSheets: {
        include: {
          scores: true
        }
      }
    },
    orderBy: {
      round: 'desc'
    }
  })

  // All teams with non-empty submissions or promoted to round 2/3
  const detailed = teams.filter(t => 
    t.round > 1 ||
    (t.projectTitle && t.projectTitle !== 'N/A') || 
    (t.agentName && t.agentName !== 'N/A') ||
    (t.demoUrl && t.demoUrl !== 'N/A') ||
    (t.githubUrl && t.githubUrl !== 'N/A') ||
    (t.agentPhoneNumber && t.agentPhoneNumber !== 'N/A')
  )

  console.log(`TOTAL_DETAILED_OR_ROUND2: ${detailed.length}`)
  console.log(JSON.stringify(detailed.map((t, idx) => ({
    id: idx + 1,
    teamName: t.name,
    round: t.round,
    track: t.track?.name || 'Voice AI',
    projectTitle: t.projectTitle || 'N/A',
    agentName: t.agentName || 'N/A',
    agentPhone: t.agentPhoneNumber || 'N/A',
    demoUrl: t.demoUrl || 'N/A',
    githubUrl: t.githubUrl || 'N/A',
    techStack: t.techStack?.join(', ') || 'N/A',
    leader: t.application?.teamLeaderName || t.members[0]?.name || 'N/A',
    email: t.application?.teamLeaderEmail || t.members[0]?.email || 'N/A',
    members: t.members.map(m => m.name).join(', '),
    description: t.projectDescription || t.application?.projectDescription || 'N/A',
    solution: t.agentSolution || 'N/A'
  })), null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
