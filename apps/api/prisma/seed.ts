import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database for Multi-Hackathon Architecture...')

  // Load configuration from env, fallback to safe defaults
  const superAdminEmail = process.env.SEED_SUPER_ADMIN_EMAIL ?? 'super@theaitel.com'
  const superAdminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'SuperSecurePass123!'

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@theaitel.com'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'AdminSecurePass123!'

  const judgeEmail = process.env.SEED_JUDGE_EMAIL ?? 'judge@theaitel.com'
  const judgePassword = process.env.SEED_JUDGE_PASSWORD ?? 'JudgeSecurePass123!'

  // Hash passwords
  const superAdminHashed = await bcrypt.hash(superAdminPassword, 10)
  const adminHashed = await bcrypt.hash(adminPassword, 10)
  const judgeHashed = await bcrypt.hash(judgePassword, 10)

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

  await prisma.account.upsert({
    where: { id: `acc_super_${superUser.id}` },
    update: { password: superAdminHashed },
    create: {
      id: `acc_super_${superUser.id}`,
      userId: superUser.id,
      providerId: 'email',
      accountId: superAdminEmail,
      password: superAdminHashed,
    },
  })

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

  await prisma.account.upsert({
    where: { id: `acc_admin_${adminUser.id}` },
    update: { password: adminHashed },
    create: {
      id: `acc_admin_${adminUser.id}`,
      userId: adminUser.id,
      providerId: 'email',
      accountId: adminEmail,
      password: adminHashed,
    },
  })

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

  await prisma.account.upsert({
    where: { id: `acc_judge_${judgeUser.id}` },
    update: { password: judgeHashed },
    create: {
      id: `acc_judge_${judgeUser.id}`,
      userId: judgeUser.id,
      providerId: 'email',
      accountId: judgeEmail,
      password: judgeHashed,
    },
  })

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

  // 5. Seed Event Settings
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
