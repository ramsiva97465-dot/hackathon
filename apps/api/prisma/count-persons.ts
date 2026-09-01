import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const totalTeams = await prisma.team.count()
  const totalTeamMembers = await prisma.teamMember.count()
  const totalUsers = await prisma.user.count()
  const totalApplications = await prisma.application.count()

  // Get distinct participant emails
  const teamMembers = await prisma.teamMember.findMany({
    select: { email: true, name: true }
  })
  const uniqueMemberEmails = new Set(teamMembers.map(m => m.email.toLowerCase().trim()))

  // Round breakdown
  const round1Teams = await prisma.team.count({ where: { round: 1 } })
  const round2Teams = await prisma.team.count({ where: { round: 2 } })
  const round3Teams = await prisma.team.count({ where: { round: 3 } })

  console.log(JSON.stringify({
    totalTeams,
    totalTeamMembers,
    uniquePersonsCount: uniqueMemberEmails.size,
    totalRegisteredUsers: totalUsers,
    totalApplications,
    roundBreakdown: {
      round1: round1Teams,
      round2: round2Teams,
      round3: round3Teams
    }
  }, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
