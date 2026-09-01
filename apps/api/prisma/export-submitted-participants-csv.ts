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
    'Participant Name',
    'Participant Email',
    'Role',
    'Project Title',
    'Voice Agent Name',
    'Live Agent Phone Number',
    'Demo / Slides URL'
  ]

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""'
    const str = String(val).replace(/"/g, '""')
    return `"${str}"`
  }

  let participantIndex = 1
  const rows: string[] = []

  submittedTeams.forEach((t, tIdx) => {
    const tableNum = t.tableNumber || `Table ${tIdx + 1}`
    t.members.forEach((m, mIdx) => {
      rows.push([
        participantIndex++,
        tableNum,
        t.name,
        m.name,
        m.email,
        m.role || (mIdx === 0 ? 'Leader' : 'Member'),
        t.projectTitle || t.application?.projectTitle || 'N/A',
        t.agentName || 'N/A',
        t.agentPhoneNumber || 'N/A',
        t.demoUrl || 'N/A'
      ].map(escapeCsv).join(','))
    })
  })

  const csvContent = [headers.map(escapeCsv).join(','), ...rows].join('\n')
  const outputPath = path.join(__dirname, '..', '..', '..', 'submitted_participants_by_table.csv')
  fs.writeFileSync(outputPath, csvContent, 'utf-8')
  console.log(`✅ Exported ${rows.length} submitted participants to: ${outputPath}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
