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
  console.log('🧑‍💻 Seeding dummy participants for existing teams...')

  const hackathon = await prisma.hackathon.findFirst({
    where: { slug: 'ai-voice-agent-2026' }
  })

  if (!hackathon) {
    console.error('Hackathon not found! Run the main seed.ts first.')
    return
  }

  const teams = await prisma.team.findMany({
    where: { hackathonId: hackathon.id }
  })

  if (teams.length === 0) {
    console.error('No teams found! Run the main seed.ts first.')
    return
  }

  const commonPassword = 'Password123!'
  const passwordHash = await hashPassword(commonPassword)

  for (const [idx, team] of teams.entries()) {
    const email = `participant${idx + 1}@${team.name.toLowerCase().replace(/\s+/g, '')}.com`
    
    // Check if team member exists
    let member = await prisma.teamMember.findFirst({
      where: { teamId: team.id, email }
    })

    if (!member) {
      member = await prisma.teamMember.create({
        data: {
          teamId: team.id,
          name: `Lead - ${team.name}`,
          email,
          role: 'TEAM_LEADER',
        }
      })
    }

    console.log(`✅ Seeded Participant: ${email} | Team: ${team.name}`)
  }
}

main()
  .catch((e) => {
    console.error('Error seeding participants:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
