import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const hackathon = await prisma.hackathon.findFirst({
    include: {
      teams: {
        include: {
          track: true,
          members: true,
          application: true,
          scoreSheets: {
            include: {
              scores: true
            }
          },
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  })

  if (!hackathon) {
    console.log('No hackathon found.')
    return
  }

  const output = hackathon.teams.map((t, idx) => {
    const totalJudgeScore = t.scoreSheets.reduce((sheetSum, sheet) => {
      const sheetTotal = sheet.scores.reduce((scoreSum, s) => scoreSum + s.score, 0)
      return sheetSum + sheetTotal
    }, 0)
    const avgScore = t.scoreSheets.length > 0 ? (totalJudgeScore / t.scoreSheets.length).toFixed(1) : '0.0'

    return {
      sNo: idx + 1,
      teamId: t.id,
      teamName: t.name,
      track: t.track?.name || 'Voice AI',
      college: t.application?.college || 'N/A',
      teamLeaderName: t.application?.teamLeaderName || t.members[0]?.name || 'N/A',
      teamLeaderEmail: t.application?.teamLeaderEmail || t.members[0]?.email || 'N/A',
      memberCount: t.members.length,
      members: t.members.map(m => `${m.name} (${m.email})`).join(', '),
      tableNumber: t.tableNumber || 'N/A',
      round: t.round,
      status: t.status,
      projectTitle: t.projectTitle || t.application?.projectTitle || 'N/A',
      projectDescription: t.projectDescription || t.application?.projectDescription || 'N/A',
      agentName: t.agentName || 'N/A',
      agentPhoneNumber: t.agentPhoneNumber || 'N/A',
      agentSolution: t.agentSolution || 'N/A',
      githubUrl: t.githubUrl || 'N/A',
      demoUrl: t.demoUrl || 'N/A',
      techStack: t.techStack?.length ? t.techStack.join(', ') : 'N/A',
      adminScore: t.adminScore ?? 'N/A',
      judgeCount: t.scoreSheets.length,
      avgJudgeScore: avgScore
    }
  })

  console.log(JSON.stringify(output, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
