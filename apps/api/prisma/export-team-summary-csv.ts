import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

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

  const headers = [
    'S.No',
    'Table Number',
    'Team Name',
    'Member Count',
    'Team Leader',
    'Leader Email',
    'All Team Members',
    'Project Title',
    'Voice Agent Name',
    'Agent Phone Number',
    'Demo / Slides URL'
  ]

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""'
    const str = String(val).replace(/"/g, '""')
    return `"${str}"`
  }

  const rows = submittedTeams.map((t, idx) => {
    const tableNum = t.tableNumber || `Table ${idx + 1}`
    const leader = t.application?.teamLeaderName || t.members[0]?.name || 'N/A'
    const leaderEmail = t.application?.teamLeaderEmail || t.members[0]?.email || 'N/A'
    const allMembers = t.members.map(m => `${m.name} (${m.email})`).join(', ')

    return [
      idx + 1,
      tableNum,
      t.name,
      t.members.length,
      leader,
      leaderEmail,
      allMembers,
      t.projectTitle || t.application?.projectTitle || 'N/A',
      t.agentName || 'N/A',
      t.agentPhoneNumber || 'N/A',
      t.demoUrl || 'N/A'
    ].map(escapeCsv).join(',')
  })

  const csvContent = [headers.map(escapeCsv).join(','), ...rows].join('\n')
  const outputPath = path.join(__dirname, '..', '..', '..', 'submitted_teams_summary.csv')
  fs.writeFileSync(outputPath, csvContent, 'utf-8')
  console.log(`✅ Exported ${submittedTeams.length} submitted teams to: ${outputPath}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
