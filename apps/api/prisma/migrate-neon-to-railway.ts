import { PrismaClient } from '@prisma/client'

// Source: Neon DB
const rawNeonUrl = process.env.NEON_DATABASE_URL || 
  'postgresql://neondb_owner:npg_ZRF96scSpULE@ep-wild-dawn-ay4chne8-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require'

const neonUrl = rawNeonUrl.includes('connect_timeout') ? rawNeonUrl : `${rawNeonUrl}&connect_timeout=60`

// Destination: Railway DB (Passed via env or argument)
const rawRailwayUrl = process.env.RAILWAY_DATABASE_URL || process.argv[2] || 
  'postgresql://postgres:nTrYxPSfjgNgiRvDGXTzhzUMrFJkbhJO@tokaido.proxy.rlwy.net:50474/railway'

const railwayUrl = rawRailwayUrl.includes('connect_timeout') ? rawRailwayUrl : `${rawRailwayUrl}?connect_timeout=60`

console.log('🔌 Initializing database clients...')
console.log(`📦 Source: ${neonUrl.split('@')[1]}`)
console.log(`🎯 Destination: ${railwayUrl.split('@')[1]}`)

const sourcePrisma = new PrismaClient({
  datasources: { db: { url: neonUrl } }
})

const destPrisma = new PrismaClient({
  datasources: { db: { url: railwayUrl } }
})

async function retry<T>(fn: () => Promise<T>, retries = 5, delayMs = 3000): Promise<T> {
  let lastErr: any
  for (let i = 1; i <= retries; i++) {
    try {
      return await fn()
    } catch (err: any) {
      lastErr = err
      console.warn(`⚠️ Attempt ${i}/${retries} failed (${err.message}). Retrying in ${delayMs / 1000}s...`)
      await new Promise(r => setTimeout(r, delayMs))
    }
  }
  throw lastErr
}

async function migrate() {
  console.log('🚀 Starting Full Neon -> Railway Database Migration...')

  try {
    // 1. Hackathons
    const hackathons = await retry(() => sourcePrisma.hackathon.findMany())
    console.log(`\n1/18 Migrating Hackathons (${hackathons.length})...`)
    for (const h of hackathons) {
      await destPrisma.hackathon.upsert({
        where: { id: h.id },
        update: h,
        create: h
      })
    }

    // 2. Tracks
    const tracks = await retry(() => sourcePrisma.track.findMany())
    console.log(`2/18 Migrating Tracks (${tracks.length})...`)
    for (const t of tracks) {
      await destPrisma.track.upsert({
        where: { id: t.id },
        update: t,
        create: t
      })
    }

    // 3. Users
    const users = await retry(() => sourcePrisma.user.findMany())
    console.log(`3/18 Migrating Users (${users.length})...`)
    for (const u of users) {
      await destPrisma.user.upsert({
        where: { id: u.id },
        update: u,
        create: u
      })
    }

    // 4. Accounts
    const accounts = await retry(() => sourcePrisma.account.findMany())
    console.log(`4/18 Migrating Accounts (${accounts.length})...`)
    for (const a of accounts) {
      await destPrisma.account.upsert({
        where: { id: a.id },
        update: a,
        create: a
      })
    }

    // 5. Sessions
    const sessions = await retry(() => sourcePrisma.session.findMany())
    console.log(`5/18 Migrating Sessions (${sessions.length})...`)
    for (const s of sessions) {
      await destPrisma.session.upsert({
        where: { id: s.id },
        update: s,
        create: s
      })
    }

    // 6. Judges
    const judges = await retry(() => sourcePrisma.judge.findMany())
    console.log(`6/18 Migrating Judges (${judges.length})...`)
    for (const j of judges) {
      await destPrisma.judge.upsert({
        where: { id: j.id },
        update: j,
        create: j
      })
    }

    // 7. Applications
    const applications = await retry(() => sourcePrisma.application.findMany())
    console.log(`7/18 Migrating Applications (${applications.length})...`)
    for (const app of applications) {
      await destPrisma.application.upsert({
        where: { id: app.id },
        update: app,
        create: app
      })
    }

    // 8. Teams (with submissions, table numbers, phone numbers, etc.)
    const teams = await retry(() => sourcePrisma.team.findMany())
    console.log(`8/18 Migrating Teams with Submissions (${teams.length})...`)
    for (const team of teams) {
      await destPrisma.team.upsert({
        where: { id: team.id },
        update: team,
        create: team
      })
    }

    // 9. Team Members (Participants)
    const members = await retry(() => sourcePrisma.teamMember.findMany())
    console.log(`9/18 Migrating Participants / Team Members (${members.length})...`)
    for (const m of members) {
      await destPrisma.teamMember.upsert({
        where: { id: m.id },
        update: m,
        create: m
      })
    }

    // 10. Judge Assignments
    const assignments = await retry(() => sourcePrisma.judgeAssignment.findMany())
    console.log(`10/18 Migrating Judge Assignments (${assignments.length})...`)
    for (const ja of assignments) {
      await destPrisma.judgeAssignment.upsert({
        where: { id: ja.id },
        update: ja,
        create: ja
      })
    }

    // 11. Score Criteria
    const criteria = await retry(() => sourcePrisma.scoreCriteria.findMany())
    console.log(`11/18 Migrating Score Criteria (${criteria.length})...`)
    for (const sc of criteria) {
      await destPrisma.scoreCriteria.upsert({
        where: { id: sc.id },
        update: sc,
        create: sc
      })
    }

    // 12. Score Sheets
    const scoreSheets = await retry(() => sourcePrisma.scoreSheet.findMany())
    console.log(`12/18 Migrating Score Sheets (${scoreSheets.length})...`)
    for (const ss of scoreSheets) {
      await destPrisma.scoreSheet.upsert({
        where: { id: ss.id },
        update: ss,
        create: ss
      })
    }

    // 13. Scores
    const scores = await retry(() => sourcePrisma.score.findMany())
    console.log(`13/18 Migrating Scores (${scores.length})...`)
    for (const score of scores) {
      await destPrisma.score.upsert({
        where: { id: score.id },
        update: score,
        create: score
      })
    }

    // 14. Leaderboard
    const leaderboards = await retry(() => sourcePrisma.leaderboard.findMany())
    console.log(`14/18 Migrating Leaderboard (${leaderboards.length})...`)
    for (const lb of leaderboards) {
      await destPrisma.leaderboard.upsert({
        where: { id: lb.id },
        update: lb,
        create: lb
      })
    }

    // 15. Settings
    const settings = await retry(() => sourcePrisma.setting.findMany())
    console.log(`15/18 Migrating Settings (${settings.length})...`)
    for (const set of settings) {
      await destPrisma.setting.upsert({
        where: { id: set.id },
        update: set,
        create: set
      })
    }

    // 16. Announcements
    const announcements = await retry(() => sourcePrisma.announcement.findMany())
    console.log(`16/18 Migrating Announcements (${announcements.length})...`)
    for (const a of announcements) {
      await destPrisma.announcement.upsert({
        where: { id: a.id },
        update: a,
        create: a
      })
    }

    // 17. Sponsors
    const sponsors = await retry(() => sourcePrisma.sponsor.findMany())
    console.log(`17/18 Migrating Sponsors (${sponsors.length})...`)
    for (const sp of sponsors) {
      await destPrisma.sponsor.upsert({
        where: { id: sp.id },
        update: sp,
        create: sp
      })
    }

    // 18. Email Templates
    const emailTemplates = await retry(() => sourcePrisma.emailTemplate.findMany())
    console.log(`18/18 Migrating Email Templates (${emailTemplates.length})...`)
    for (const et of emailTemplates) {
      await destPrisma.emailTemplate.upsert({
        where: { id: et.id },
        update: et,
        create: et
      })
    }

    console.log('\n🎉 ==============================================')
    console.log('✅ COMPLETE! ALL DATA SUCCESSFULLY MIGRATED TO RAILWAY!')
    console.log('==============================================')
    console.log(`Summary:`)
    console.log(`- Teams: ${teams.length}`)
    console.log(`- Participants / Members: ${members.length}`)
    console.log(`- Submissions & Project Details: ${teams.filter(t => t.projectTitle || t.agentPhoneNumber).length}`)
    console.log(`- Score Sheets: ${scoreSheets.length}`)
    console.log(`- Scores: ${scores.length}`)
    console.log(`- Judges: ${judges.length}`)
    console.log(`- Users: ${users.length}`)
    console.log('==============================================\n')

  } catch (error) {
    console.error('❌ Migration failed with error:', error)
  } finally {
    await sourcePrisma.$disconnect()
    await destPrisma.$disconnect()
  }
}

migrate()
