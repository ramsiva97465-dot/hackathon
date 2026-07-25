import { PrismaClient } from '@prisma/client'
import { hashPassword } from 'better-auth/crypto'

const prisma = new PrismaClient()

async function upsertCredentialAccount(
  userId: string,
  accountKey: string,
  passwordHash: string,
) {
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
  console.log('🌱 Seeding database for Multi-Hackathon Architecture...')

  // Load configuration from env, fallback to safe defaults
  const superAdminEmail = process.env.SEED_SUPER_ADMIN_EMAIL ?? 'super@theaitel.com'
  const superAdminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'SuperSecurePass123!'

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@theaitel.com'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'AdminSecurePass123!'

  const judgeEmail = process.env.SEED_JUDGE_EMAIL ?? 'judge@theaitel.com'
  const judgePassword = process.env.SEED_JUDGE_PASSWORD ?? 'JudgeSecurePass123!'

  // Hash with Better Auth's hasher so sign-in/password.verify succeeds
  const superAdminHashed = await hashPassword(superAdminPassword)
  const adminHashed = await hashPassword(adminPassword)
  const judgeHashed = await hashPassword(judgePassword)

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

  // 2. Create Default Tracks
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

  // 3. Create Default Score Criteria
  const defaultCriteria = [
    { name: 'Innovation', description: 'Uniqueness and originality of the voice assistant.', weight: 1.0 },
    { name: 'Technical Complexity', description: 'Round-trip latency, robust audio pipeline, and model orchestration.', weight: 1.5 },
    { name: 'UI/UX', description: 'Tactile dashboard feedback and natural sound generation.', weight: 1.0 },
    { name: 'Scalability', description: 'Concurrency loads, safe moderation guards, and deployment patterns.', weight: 1.0 },
  ]

  for (const criteria of defaultCriteria) {
    await prisma.scoreCriteria.upsert({
      where: { hackathonId_name: { hackathonId: hackathon.id, name: criteria.name } },
      update: { weight: criteria.weight },
      create: {
        hackathonId: hackathon.id,
        name: criteria.name,
        description: criteria.description,
        weight: criteria.weight,
        maxScore: 10,
      },
    })
  }

  // 4. Create Users
  // Super Admin
  const superUser = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: { role: 'SUPER_ADMIN' },
    create: {
      email: superAdminEmail,
      name: 'Super Admin User',
      role: 'SUPER_ADMIN',
      emailVerified: true,
    },
  })

  await upsertCredentialAccount(superUser.id, `acc_super_${superUser.id}`, superAdminHashed)

  // Executive Admin
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN' },
    create: {
      email: adminEmail,
      name: 'Executive Admin User',
      role: 'ADMIN',
      emailVerified: true,
    },
  })

  await upsertCredentialAccount(adminUser.id, `acc_admin_${adminUser.id}`, adminHashed)

  // Judge
  const judgeUser = await prisma.user.upsert({
    where: { email: judgeEmail },
    update: { role: 'JUDGE' },
    create: {
      email: judgeEmail,
      name: 'Voice AI Judge User',
      role: 'JUDGE',
      emailVerified: true,
    },
  })

  await upsertCredentialAccount(judgeUser.id, `acc_judge_${judgeUser.id}`, judgeHashed)

  // Create Judge Profile
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

  // 5. Create 5 Dummy Teams and Assign to Judge
  const dummyTeamsData = [
    { name: 'EchoFlow AI', college: 'IIT Madras', trackId: trackVoice.id, title: 'Real-time Latency Voice Assistant' },
    { name: 'VoxAgent Pro', college: 'BITS Pilani', trackId: trackVoice.id, title: 'Conversational Sales Voice Bot' },
    { name: 'AudioMind', college: 'VIT Vellore', trackId: trackConv.id, title: 'Multilingual Audio Summarizer' },
    { name: 'SonicPulse', college: 'NIT Trichy', trackId: trackConv.id, title: 'Noise Cancelling Voice Streamer' },
    { name: 'ResoNance', college: 'SRM Institute', trackId: trackVoice.id, title: 'Emotion Aware Voice Cloning Engine' },
  ]

  for (const [idx, dt] of dummyTeamsData.entries()) {
    let team = await prisma.team.findFirst({
      where: { hackathonId: hackathon.id, name: dt.name }
    })

    if (!team) {
      team = await prisma.team.create({
        data: {
          hackathonId: hackathon.id,
          name: dt.name,
          trackId: dt.trackId,
          tableNumber: `T-0${idx + 1}`,
          status: 'COMPETING',
        }
      })
    }

    // Assign team to judge
    const existingAssignment = await prisma.judgeAssignment.findFirst({
      where: { judgeId: judgeUser.id, teamId: team.id }
    })

    if (!existingAssignment) {
      await prisma.judgeAssignment.create({
        data: {
          hackathonId: hackathon.id,
          judgeId: judgeUser.id,
          teamId: team.id,
        }
      })
    }
  }

  // 6. Seed Event Settings
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

  console.log('✅ Database seeded successfully!')
  console.log(`- Active Hackathon: ${hackathon.name}`)
  console.log(`- Super Admin: ${superAdminEmail} / ${superAdminPassword}`)
  console.log(`- Executive Admin: ${adminEmail} / ${adminPassword}`)
  console.log(`- Voice AI Judge: ${judgeEmail} / ${judgePassword}`)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
