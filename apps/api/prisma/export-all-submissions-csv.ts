import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

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
    orderBy: [
      { round: 'desc' },
      { name: 'asc' }
    ]
  })

  // CSV Header
  const headers = [
    'S.No',
    'Team Name',
    'Round',
    'Track',
    'Team Leader',
    'Leader Email',
    'Team Members',
    'Project Title',
    'Agent Name',
    'Agent Phone Number',
    'Demo URL / Slides',
    'GitHub URL',
    'Tech Stack',
    'Project Description',
    'Solution / Problem Solved',
    'Average Judge Score',
    'Judges Evaluated Count'
  ]

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""'
    const str = String(val).replace(/"/g, '""')
    return `"${str}"`
  }

  const rows = teams.map((t, idx) => {
    const totalScore = t.scoreSheets.reduce((sum, sheet) => {
      return sum + sheet.scores.reduce((sSum, s) => sSum + s.score, 0)
    }, 0)
    const avgScore = t.scoreSheets.length ? (totalScore / t.scoreSheets.length).toFixed(1) : '0.0'

    return [
      idx + 1,
      t.name,
      t.round,
      t.track?.name || 'Voice AI',
      t.application?.teamLeaderName || t.members[0]?.name || 'N/A',
      t.application?.teamLeaderEmail || t.members[0]?.email || 'N/A',
      t.members.map(m => m.name).join(', ') || 'N/A',
      t.projectTitle || t.application?.projectTitle || 'N/A',
      t.agentName || 'N/A',
      t.agentPhoneNumber || 'N/A',
      t.demoUrl || 'N/A',
      t.githubUrl || 'N/A',
      t.techStack?.join(', ') || 'N/A',
      t.projectDescription || t.application?.projectDescription || 'N/A',
      t.agentSolution || 'N/A',
      avgScore,
      t.scoreSheets.length
    ].map(escapeCsv).join(',')
  })

  const csvContent = [headers.map(escapeCsv).join(','), ...rows].join('\n')
  const outputPath = path.join(__dirname, '..', '..', '..', 'submissions_full_report.csv')
  fs.writeFileSync(outputPath, csvContent, 'utf-8')
  console.log(`✅ Exported ${teams.length} submissions to: ${outputPath}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
