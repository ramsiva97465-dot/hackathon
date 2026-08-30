import { PrismaClient, ApplicationType, ApplicationStatus, TeamStatus } from '@prisma/client'
import { hashPassword } from 'better-auth/crypto'

const prisma = new PrismaClient()

interface NewEntry {
  name: string
  email: string
  teamType: string
  teamName: string
}

const rawEntries: NewEntry[] = [
  { name: 'chandru, B', email: 'droptochandru.in@gmail.com', teamType: '3 -4 member', teamName: 'Aura' },
  { name: 'S Ashwanth, Sankar', email: 'ashwanthsankar2k@gmail.com', teamType: 'Solo', teamName: 'Kaze AI' },
  { name: 'Mukesh, M', email: 'journeywithmugi@gmail.com', teamType: '2 member', teamName: 'Unicorn' },
  { name: 'Mukesh, M', email: 'mukeshmugi1114@gmail.com', teamType: '2 member', teamName: 'Unicorn' },
  { name: 'Priya, S', email: 'priya19072006@gmail.com', teamType: '3 -4 member', teamName: 'Tech Innovators' },
  { name: 'Jeevitha, Suresh', email: 'jeevithasuresh296@gmail.com', teamType: '2 member', teamName: 'innovative stars' }
]

async function upsertCredentialAccount(userId: string, accountKey: string, passwordHash: string) {
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
  console.log('🚀 Importing new teams & members into Database...')

  const hackathon = await prisma.hackathon.findFirst()
  if (!hackathon) {
    throw new Error('No hackathon found in database!')
  }

  const track = await prisma.track.findFirst({
    where: { hackathonId: hackathon.id }
  })
  if (!track) {
    throw new Error('No track found in database!')
  }

  const commonPassword = 'Password123!'
  const passwordHash = await hashPassword(commonPassword)

  // Group entries by normalized team name
  const teamGroups: Record<string, { displayTeamName: string; teamType: string; members: { name: string; email: string }[] }> = {}

  for (const entry of rawEntries) {
    const normName = entry.teamName.trim().toLowerCase()
    if (!teamGroups[normName]) {
      teamGroups[normName] = {
        displayTeamName: entry.teamName.trim(),
        teamType: entry.teamType,
        members: []
      }
    }
    const exists = teamGroups[normName].members.some(m => m.email.toLowerCase() === entry.email.trim().toLowerCase())
    if (!exists) {
      teamGroups[normName].members.push({
        name: entry.name.trim(),
        email: entry.email.trim().toLowerCase()
      })
    }
  }

  for (const [normName, group] of Object.entries(teamGroups)) {
    console.log(`\n📦 Processing team: "${group.displayTeamName}" with ${group.members.length} members...`)

    // 1. Check if team already exists
    let team = await prisma.team.findFirst({
      where: {
        hackathonId: hackathon.id,
        name: { equals: group.displayTeamName, mode: 'insensitive' }
      }
    })

    const leader = group.members[0]
    const isSolo = group.teamType.toLowerCase().includes('solo') || group.members.length === 1

    // 2. Create or find Application
    let application = await prisma.application.findFirst({
      where: {
        hackathonId: hackathon.id,
        teamName: { equals: group.displayTeamName, mode: 'insensitive' }
      }
    })

    if (!application) {
      application = await prisma.application.create({
        data: {
          hackathonId: hackathon.id,
          trackId: track.id,
          teamName: group.displayTeamName,
          type: isSolo ? ApplicationType.INDIVIDUAL : ApplicationType.TEAM,
          teamLeaderName: leader.name,
          teamLeaderEmail: leader.email,
          teamSize: group.members.length,
          status: ApplicationStatus.APPROVED,
          approvalTimestamp: new Date(),
        }
      })
      console.log(`  ✅ Created Application: ${application.id}`)
    } else {
      console.log(`  ℹ️ Application already exists: ${application.id}`)
    }

    // 3. Create Team if missing
    if (!team) {
      team = await prisma.team.create({
        data: {
          hackathonId: hackathon.id,
          trackId: track.id,
          applicationId: application.id,
          name: group.displayTeamName,
          status: TeamStatus.COMPETING,
          round: 1,
        }
      })
      console.log(`  ✅ Created Team: ${team.name} (ID: ${team.id})`)
    } else {
      console.log(`  ℹ️ Team already exists: ${team.name} (ID: ${team.id})`)
    }

    // 4. Create Members & User accounts
    for (const member of group.members) {
      let teamMember = await prisma.teamMember.findFirst({
        where: {
          email: member.email,
          teamId: team.id
        }
      })

      if (!teamMember) {
        teamMember = await prisma.teamMember.create({
          data: {
            teamId: team.id,
            applicationId: application.id,
            name: member.name,
            email: member.email,
            role: 'Member',
          }
        })
        console.log(`    👤 Created TeamMember: ${member.name} (${member.email})`)
      } else {
        console.log(`    ℹ️ TeamMember already exists: ${member.name} (${member.email})`)
      }

      // Upsert User for participant login
      let user = await prisma.user.findUnique({
        where: { email: member.email }
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            name: member.name,
            email: member.email,
            emailVerified: true,
          }
        })
        await upsertCredentialAccount(user.id, `credential_${user.id}`, passwordHash)
        console.log(`    🔑 Created login account for ${member.email} (Password: ${commonPassword})`)
      }
    }
  }

  console.log('\n🎉 Finished importing all new teams successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Import error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
