import { PrismaClient } from '@prisma/client'
import { hashPassword } from 'better-auth/crypto'
import * as fs from 'fs'
import * as path from 'path'

const railwayUrl = process.env.DATABASE_URL || 
  'postgresql://postgres:nTrYxPSfjgNgiRvDGXTzhzUMrFJkbhJO@tokaido.proxy.rlwy.net:50474/railway'

const prisma = new PrismaClient({
  datasources: { db: { url: railwayUrl } }
})

function parseCSV(content: string): Array<Record<string, string>> {
  const lines: string[] = []
  let currentLine = ''
  let insideQuotes = false

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    if (char === '"') {
      insideQuotes = !insideQuotes
      currentLine += char
    } else if (char === '\n' && !insideQuotes) {
      lines.push(currentLine)
      currentLine = ''
    } else if (char === '\r' && !insideQuotes) {
      // skip
    } else {
      currentLine += char
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine)
  }

  if (lines.length === 0) return []

  const parseRow = (rowStr: string): string[] => {
    const cells: string[] = []
    let cell = ''
    let inQ = false
    for (let i = 0; i < rowStr.length; i++) {
      const c = rowStr[i]
      if (c === '"') {
        if (inQ && rowStr[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          inQ = !inQ
        }
      } else if (c === ',' && !inQ) {
        cells.push(cell.trim())
        cell = ''
      } else {
        cell += c
      }
    }
    cells.push(cell.trim())
    return cells
  }

  const headers = parseRow(lines[0])
  const records: Array<Record<string, string>> = []

  for (let idx = 1; idx < lines.length; idx++) {
    const line = lines[idx].trim()
    if (!line) continue
    const cells = parseRow(line)
    const rec: Record<string, string> = {}
    headers.forEach((h, hIdx) => {
      rec[h] = cells[hIdx] ?? ''
    })
    records.push(rec)
  }

  return records
}

async function upsertAccount(userId: string, accountKey: string, passwordHash: string) {
  await prisma.account.upsert({
    where: { id: accountKey },
    update: {
      providerId: 'credential',
      accountId: userId,
      password: passwordHash,
    },
    create: {
      id: accountKey,
      userId,
      providerId: 'credential',
      accountId: userId,
      password: passwordHash,
    },
  })
}

async function main() {
  console.log('🚀 Seeding Full Hackathon Data into Railway Postgres...')
  console.log(`🎯 Database: ${railwayUrl.split('@')[1]}`)

  // 1. Create Default Hackathon
  const hackathon = await prisma.hackathon.upsert({
    where: { slug: 'ai-voice-agent-2026' },
    update: {},
    create: {
      name: 'AI Voice Agent Hackathon 2026',
      slug: 'ai-voice-agent-2026',
      description: 'Build the future of voice-first conversational artificial intelligence systems.',
      startDate: new Date('2026-08-15T09:00:00Z'),
      endDate: new Date('2026-08-17T18:00:00Z'),
      registrationStartDate: new Date('2026-07-01T00:00:00Z'),
      registrationEndDate: new Date('2026-08-10T23:59:59Z'),
    },
  })
  console.log(`✅ Hackathon initialized: ${hackathon.name} (${hackathon.id})`)

  // 2. Create Tracks
  const trackVoice = await prisma.track.upsert({
    where: { hackathonId_slug: { hackathonId: hackathon.id, slug: 'voice-ai' } },
    update: {},
    create: {
      hackathonId: hackathon.id,
      name: 'Voice AI',
      slug: 'voice-ai',
      description: 'Emotion detection, voice cloning, and audio synthesis.',
    },
  })

  const trackConv = await prisma.track.upsert({
    where: { hackathonId_slug: { hackathonId: hackathon.id, slug: 'conversational-ai' } },
    update: {},
    create: {
      hackathonId: hackathon.id,
      name: 'Conversational AI',
      slug: 'conversational-ai',
      description: 'Latency optimization, context retrieval, and complex dialog models.',
    },
  })
  console.log(`✅ Tracks initialized: Voice AI & Conversational AI`)

  // 3. Create Score Criteria
  const defaultCriteria = [
    { name: 'Innovation', description: 'Uniqueness and originality of the voice assistant.', weight: 1.0 },
    { name: 'Technical Complexity', description: 'Round-trip latency, robust audio pipeline, and model orchestration.', weight: 1.5 },
    { name: 'UI/UX', description: 'Tactile dashboard feedback and natural sound generation.', weight: 1.0 },
    { name: 'Scalability', description: 'Concurrency loads, safe moderation guards, and deployment patterns.', weight: 1.0 },
  ]

  for (const criteria of defaultCriteria) {
    await prisma.scoreCriteria.upsert({
      where: { hackathonId_name: { hackathonId: hackathon.id, name: criteria.name } },
      update: { weight: criteria.weight, maxScore: 2 },
      create: {
        hackathonId: hackathon.id,
        name: criteria.name,
        description: criteria.description,
        weight: criteria.weight,
        maxScore: 2,
      },
    })
  }
  console.log(`✅ Score Criteria created`)

  // 4. Create Admins and Judges
  const superAdminHashed = await hashPassword('SuperSecurePass123!')
  const adminHashed = await hashPassword('snapserve.ai')
  const admin2Hashed = await hashPassword('admin123')
  const judgeHashed = await hashPassword('JudgeSecurePass123!')

  const superUser = await prisma.user.upsert({
    where: { email: 'super@theaitel.com' },
    update: { role: 'SUPER_ADMIN' },
    create: {
      email: 'super@theaitel.com',
      name: 'Super Admin User',
      role: 'SUPER_ADMIN',
      emailVerified: true,
    },
  })
  await upsertAccount(superUser.id, `acc_super_${superUser.id}`, superAdminHashed)

  const adminUser = await prisma.user.upsert({
    where: { email: 'snapserve.ai@gmail.com' },
    update: { role: 'ADMIN' },
    create: {
      email: 'snapserve.ai@gmail.com',
      name: 'Executive Admin User',
      role: 'ADMIN',
      emailVerified: true,
    },
  })
  await upsertAccount(adminUser.id, `acc_admin_${adminUser.id}`, adminHashed)

  const admin2User = await prisma.user.upsert({
    where: { email: 'admin@hackathon.com' },
    update: { role: 'ADMIN' },
    create: {
      email: 'admin@hackathon.com',
      name: 'Hackathon Admin User',
      role: 'ADMIN',
      emailVerified: true,
    },
  })
  await upsertAccount(admin2User.id, `acc_admin2_${admin2User.id}`, admin2Hashed)

  const judgeUser = await prisma.user.upsert({
    where: { email: 'judge@theaitel.com' },
    update: { role: 'JUDGE' },
    create: {
      email: 'judge@theaitel.com',
      name: 'Voice AI Judge User',
      role: 'JUDGE',
      emailVerified: true,
    },
  })
  await upsertAccount(judgeUser.id, `acc_judge_${judgeUser.id}`, judgeHashed)

  await prisma.judge.upsert({
    where: { id: judgeUser.id },
    update: { hackathonId: hackathon.id },
    create: {
      id: judgeUser.id,
      hackathonId: hackathon.id,
      company: 'ElevenLabs',
      designation: 'Senior Speech Scientist',
      bio: 'Expert in generative speech synthesis pipelines.',
    },
  })
  console.log(`✅ Admin & Judge Users created`)

  // 5. Read table mappings from submitted_participants_by_table.csv
  const tableCsvPath = path.resolve(__dirname, '../../../submitted_participants_by_table.csv')
  const tableMapping: Record<string, { tableNumber: string; roleMap: Record<string, string> }> = {}

  if (fs.existsSync(tableCsvPath)) {
    const tableCsvContent = fs.readFileSync(tableCsvPath, 'utf8')
    const tableRecords = parseCSV(tableCsvContent)
    for (const row of tableRecords) {
      const teamNameNorm = (row['Team Name'] || '').trim().toLowerCase()
      const tableNumber = (row['Table Number'] || '').replace(/Table\s*/i, '').trim()
      const email = (row['Participant Email'] || '').trim().toLowerCase()
      const role = (row['Role'] || '').trim()

      if (!tableMapping[teamNameNorm]) {
        tableMapping[teamNameNorm] = { tableNumber, roleMap: {} }
      }
      if (tableNumber) {
        tableMapping[teamNameNorm].tableNumber = tableNumber
      }
      if (email) {
        tableMapping[teamNameNorm].roleMap[email] = role
      }
    }
  }

  // 6. Read and import all teams and submissions from submissions_full_report.csv
  const fullReportPath = path.resolve(__dirname, '../../../submissions_full_report.csv')
  if (!fs.existsSync(fullReportPath)) {
    throw new Error(`CSV file not found at ${fullReportPath}`)
  }

  const fullReportContent = fs.readFileSync(fullReportPath, 'utf8')
  const reportRows = parseCSV(fullReportContent)
  console.log(`📋 Found ${reportRows.length} team entries in submissions report.`)

  let importedTeams = 0
  let importedMembers = 0
  let importedSubmissions = 0

  for (const row of reportRows) {
    const teamName = (row['Team Name'] || '').trim()
    if (!teamName) continue

    const teamNameNorm = teamName.toLowerCase()
    const trackName = (row['Track'] || '').trim().toLowerCase()
    const trackId = trackName.includes('conversational') ? trackConv.id : trackVoice.id

    const roundNum = parseInt(row['Round'] || '1', 10) || 1
    const leaderName = (row['Team Leader'] || '').trim()
    const leaderEmail = (row['Leader Email'] || '').trim()
    const membersRaw = (row['Team Members'] || '').trim()

    const projectTitle = row['Project Title'] && row['Project Title'] !== 'N/A' ? row['Project Title'].trim() : null
    const agentName = row['Agent Name'] && row['Agent Name'] !== 'N/A' ? row['Agent Name'].trim() : null
    const agentPhone = row['Agent Phone Number'] && row['Agent Phone Number'] !== 'N/A' ? row['Agent Phone Number'].trim() : null
    const demoUrl = row['Demo URL / Slides'] && row['Demo URL / Slides'] !== 'N/A' ? row['Demo URL / Slides'].trim() : null
    const githubUrl = row['GitHub URL'] && row['GitHub URL'] !== 'N/A' ? row['GitHub URL'].trim() : null
    const techStackRaw = row['Tech Stack'] && row['Tech Stack'] !== 'N/A' ? row['Tech Stack'].trim() : null
    const projectDesc = row['Project Description'] && row['Project Description'] !== 'N/A' ? row['Project Description'].trim() : null
    const agentSolution = row['Solution / Problem Solved'] && row['Solution / Problem Solved'] !== 'N/A' ? row['Solution / Problem Solved'].trim() : null

    const techStack = techStackRaw ? techStackRaw.split(',').map(s => s.trim()).filter(Boolean) : []
    const tableNumber = tableMapping[teamNameNorm]?.tableNumber || null

    // Create or update Team
    let team = await prisma.team.findFirst({
      where: { hackathonId: hackathon.id, name: teamName }
    })

    if (!team) {
      team = await prisma.team.create({
        data: {
          hackathonId: hackathon.id,
          name: teamName,
          trackId,
          tableNumber,
          round: roundNum,
          status: 'COMPETING',
          projectTitle,
          agentName,
          agentPhoneNumber: agentPhone,
          demoUrl,
          githubUrl,
          techStack,
          projectDescription: projectDesc,
          agentSolution,
        }
      })
    } else {
      team = await prisma.team.update({
        where: { id: team.id },
        data: {
          trackId,
          tableNumber: tableNumber || team.tableNumber,
          round: roundNum,
          status: 'COMPETING',
          projectTitle: projectTitle || team.projectTitle,
          agentName: agentName || team.agentName,
          agentPhoneNumber: agentPhone || team.agentPhoneNumber,
          demoUrl: demoUrl || team.demoUrl,
          githubUrl: githubUrl || team.githubUrl,
          techStack: techStack.length > 0 ? techStack : team.techStack,
          projectDescription: projectDesc || team.projectDescription,
          agentSolution: agentSolution || team.agentSolution,
        }
      })
    }
    importedTeams++
    if (projectTitle || agentPhone) importedSubmissions++

    // Members
    const memberNames = membersRaw ? membersRaw.split(',').map(m => m.trim()).filter(Boolean) : [leaderName].filter(Boolean)

    for (const mName of memberNames) {
      const isLeader = mName.toLowerCase() === leaderName.toLowerCase()
      const mEmail = isLeader && leaderEmail ? leaderEmail.toLowerCase() : `${mName.toLowerCase().replace(/[^a-z0-9]/g, '')}@hackathon.participant`
      
      const existingMember = await prisma.teamMember.findFirst({
        where: { teamId: team.id, name: mName }
      })

      if (!existingMember) {
        await prisma.teamMember.create({
          data: {
            teamId: team.id,
            name: mName,
            email: mEmail,
            role: isLeader ? 'Leader' : 'Member',
          }
        })
        importedMembers++
      }
    }
  }

  // 7. Settings
  await prisma.setting.upsert({
    where: { hackathonId: hackathon.id },
    update: {},
    create: {
      hackathonId: hackathon.id,
      registrationWindowStart: hackathon.registrationStartDate,
      registrationWindowEnd: hackathon.registrationEndDate,
      scoringWindowStart: hackathon.startDate,
      scoringWindowEnd: hackathon.endDate,
      leaderboardVisible: true,
      judgeAccessOpen: true,
    },
  })

  console.log('\n🎉 ==============================================')
  console.log('✅ COMPLETE! RAILWAY DATABASE FULLY POPULATED!')
  console.log('==============================================')
  console.log(`- Teams: ${importedTeams}`)
  console.log(`- Participants / Members: ${importedMembers}`)
  console.log(`- Submissions / Agent Numbers / Projects: ${importedSubmissions}`)
  console.log(`- Admin Users: super@theaitel.com, snapserve.ai@gmail.com, admin@hackathon.com`)
  console.log(`- Judge User: judge@theaitel.com (Password: JudgeSecurePass123!)`)
  console.log('==============================================\n')
}

main()
  .catch(err => {
    console.error('❌ Error seeding Railway:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
