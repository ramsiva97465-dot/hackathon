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

  console.log(`Total Teams in DB: ${teams.length}`)

  const submittedTeams = teams.filter(t => 
    (t.projectTitle && t.projectTitle !== 'N/A') || 
    (t.agentName && t.agentName !== 'N/A') ||
    (t.demoUrl && t.demoUrl !== 'N/A') ||
    (t.githubUrl && t.githubUrl !== 'N/A') ||
    (t.scoreSheets && t.scoreSheets.length > 0) ||
    (t.application?.projectTitle && t.application.projectTitle !== 'N/A')
  )

  console.log(`Teams with detailed Project Submissions / Scores: ${submittedTeams.length}`)

  const summary = teams.map((t, idx) => {
    const totalScore = t.scoreSheets.reduce((sum, sheet) => {
      return sum + sheet.scores.reduce((sSum, s) => sSum + s.score, 0)
    }, 0)
    const avgScore = t.scoreSheets.length ? (totalScore / t.scoreSheets.length).toFixed(1) : '0.0'

    return {
      index: idx + 1,
      teamName: t.name,
      round: t.round,
      track: t.track?.name || 'Voice AI',
      leader: t.application?.teamLeaderName || t.members[0]?.name || 'N/A',
      email: t.application?.teamLeaderEmail || t.members[0]?.email || 'N/A',
      members: t.members.map(m => m.name).join(', '),
      projectTitle: t.projectTitle || t.application?.projectTitle || 'N/A',
      agentName: t.agentName || 'N/A',
      agentPhone: t.agentPhoneNumber || 'N/A',
      demoUrl: t.demoUrl || 'N/A',
      githubUrl: t.githubUrl || 'N/A',
      avgScore,
      judgeCount: t.scoreSheets.length
    }
  })

  console.log('\n--- ALL SUBMITTED / DETAILED TEAMS ---')
  console.log(JSON.stringify(summary.filter(s => s.projectTitle !== 'N/A' || s.agentName !== 'N/A' || s.demoUrl !== 'N/A' || s.judgeCount > 0), null, 2))

  console.log('\n--- TOP ADVANCING TEAMS SUMMARY ---')
  console.log(JSON.stringify(summary.slice(0, 30), null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
