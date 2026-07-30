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

  const adminEmail = 'snapserve.ai@gmail.com'
  const adminPassword = 'snapserve.ai'

  const admin2Email = 'admin@hackathon.com'
  const admin2Password = 'admin123'

  const judgeEmail = process.env.SEED_JUDGE_EMAIL ?? 'judge@theaitel.com'
  const judgePassword = process.env.SEED_JUDGE_PASSWORD ?? 'JudgeSecurePass123!'

  // Hash with Better Auth's hasher so sign-in/password.verify succeeds
  const superAdminHashed = await hashPassword(superAdminPassword)
  const adminHashed = await hashPassword(adminPassword)
  const admin2Hashed = await hashPassword(admin2Password)
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

  const admin2User = await prisma.user.upsert({
    where: { email: admin2Email },
    update: { role: 'ADMIN' },
    create: {
      email: admin2Email,
      name: 'Hackathon Admin User',
      role: 'ADMIN',
      emailVerified: true,
    },
  })

  await upsertCredentialAccount(admin2User.id, `acc_admin2_${admin2User.id}`, admin2Hashed)

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
  const dummyTeamsData: Array<{
    name: string
    college: string
    trackId: string
    title: string
    description: string
    agentName: string
    agentSolution: string
    agentPhoneNumber: string
    techStack: string[]
    githubUrl: string
    demoUrl: string
    members: Array<{ name: string; email: string; role?: string; linkedin?: string; github?: string }>
  }> = [
    {
      name: 'EchoFlow AI',
      college: 'IIT Madras',
      trackId: trackVoice.id,
      title: 'Real-time Latency Tamil Voice Assistant',
      description: 'A streaming STT-LLM-TTS pipeline tuned specifically for conversational Tamil and English code-mixing over phone calls.',
      agentName: 'Vaani Voice Bot',
      agentSolution: 'Real-time Tamil customer service AI with ultra-low 250ms voice latency for automated support.',
      agentPhoneNumber: '+91 98765 43210',
      techStack: ['Python', 'FastAPI', 'Whisper', 'ElevenLabs', 'Twilio'],
      githubUrl: 'https://github.com/echoflow/voice-agent',
      demoUrl: 'https://youtube.com/watch?v=demo1',
      members: [
        { name: 'Aravinth Kumar', email: 'aravinth@echoflow.ai', role: 'Team Lead', linkedin: 'https://linkedin.com/in/aravinth', github: 'https://github.com/aravinth' },
        { name: 'Swetha Ramesh', email: 'swetha@echoflow.ai', role: 'Voice AI Specialist', linkedin: 'https://linkedin.com/in/swetha', github: 'https://github.com/swetha' }
      ]
    },
    {
      name: 'VoxAgent Pro',
      college: 'BITS Pilani',
      trackId: trackVoice.id,
      title: 'Conversational Medical Voice Triage',
      description: 'Handles emergency phone calls, triages patient symptoms in Tamil, and dispatches nearest ambulance.',
      agentName: 'Kural Health Assist',
      agentSolution: 'Autonomous emergency medical response agent for rural health kiosks operating over PSTN phone calls.',
      agentPhoneNumber: '+91 91234 56789',
      techStack: ['NestJS', 'React', 'LiveKit', 'Deepgram', 'OpenAI'],
      githubUrl: 'https://github.com/voxagent/kural-triage',
      demoUrl: 'https://youtube.com/watch?v=demo2',
      members: [
        { name: 'Vijay Anand', email: 'vijay@voxagent.io', role: 'Backend Lead' },
        { name: 'Priya Dharshini', email: 'priya@voxagent.io', role: 'Frontend Engineer' }
      ]
    },
    {
      name: 'AudioMind',
      college: 'VIT Vellore',
      trackId: trackConv.id,
      title: 'Multilingual Legal Audio Assistant',
      description: 'Translates complex legal jargon into conversational Tamil spoken audio over standard phone calls.',
      agentName: 'Niti Tamil AI',
      agentSolution: 'Voice-enabled legal consultation agent helping farmers understand agricultural land documents.',
      agentPhoneNumber: '+91 94440 12345',
      techStack: ['Python', 'LangChain', 'Sarvam AI', 'Twilio', 'Pinecone'],
      githubUrl: 'https://github.com/audiomind/niti-ai',
      demoUrl: 'https://youtube.com/watch?v=demo3',
      members: [
        { name: 'Dinesh Karthik', email: 'dinesh@audiomind.ai', role: 'AI Engineer' }
      ]
    },
    {
      name: 'SonicPulse',
      college: 'NIT Trichy',
      trackId: trackConv.id,
      title: 'Farmer Voice Helpline AI',
      description: 'Connects rural farmers to instant AI voice advisory for crops without needing internet or smartphones.',
      agentName: 'AgriCall Bot',
      agentSolution: 'Real-time crop advisory phone agent answering weather & crop disease queries in regional dialects.',
      agentPhoneNumber: '+91 99887 76655',
      techStack: ['Node.js', 'Vapi', 'OpenAI', 'Subspace'],
      githubUrl: 'https://github.com/sonicpulse/agri-call',
      demoUrl: 'https://youtube.com/watch?v=demo4',
      members: [
        { name: 'Kavitha S', email: 'kavitha@sonicpulse.dev', role: 'Full Stack' }
      ]
    },
    {
      name: 'ResoNance',
      college: 'SRM Institute',
      trackId: trackVoice.id,
      title: 'Interactive Tamil Tutor Agent',
      description: 'Engaging voice tutor for children to learn regional languages interactively over direct phone calls.',
      agentName: 'Tamil Echo',
      agentSolution: 'Natural voice clone agent providing interactive storytelling & educational tutoring.',
      agentPhoneNumber: '+91 90000 11223',
      techStack: ['Python', 'RVC', 'ElevenLabs', 'FastAPI'],
      githubUrl: 'https://github.com/resonance/tamil-echo',
      demoUrl: 'https://youtube.com/watch?v=demo5',
      members: [
        { name: 'Siddharth R', email: 'siddharth@resonance.app', role: 'ML Researcher' }
      ]
    },
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
          tableNumber: `${idx + 1}`,
          status: 'COMPETING',
          projectTitle: dt.title,
          projectDescription: dt.description,
          agentName: dt.agentName,
          agentSolution: dt.agentSolution,
          agentPhoneNumber: dt.agentPhoneNumber,
          techStack: dt.techStack,
          githubUrl: dt.githubUrl,
          demoUrl: dt.demoUrl,
        }
      })
    } else {
      team = await prisma.team.update({
        where: { id: team.id },
        data: {
          projectTitle: dt.title,
          projectDescription: dt.description,
          agentName: dt.agentName,
          agentSolution: dt.agentSolution,
          agentPhoneNumber: dt.agentPhoneNumber,
          techStack: dt.techStack,
          githubUrl: dt.githubUrl,
          demoUrl: dt.demoUrl,
          tableNumber: `${idx + 1}`,
        }
      })
    }

    // Ensure members exist
    for (const m of dt.members) {
      const existingMember = await prisma.teamMember.findFirst({
        where: { teamId: team.id, email: m.email }
      })
      if (!existingMember) {
        await prisma.teamMember.create({
          data: {
            teamId: team.id,
            name: m.name,
            email: m.email,
            role: m.role,
            linkedin: m.linkedin,
            github: m.github
          }
        })
      }
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
