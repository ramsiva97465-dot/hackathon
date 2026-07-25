import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const judges = await prisma.judge.findMany()
  const teams = await prisma.team.findMany()
  const hackathon = await prisma.hackathon.findFirst()

  if (!hackathon) {
    console.log('No hackathon found')
    return
  }

  console.log(`Found ${judges.length} judges and ${teams.length} teams.`)

  for (const judge of judges) {
    for (const team of teams) {
      // Check if assignment exists
      const exists = await prisma.judgeAssignment.findFirst({
        where: { judgeId: judge.id, teamId: team.id }
      })

      if (!exists) {
        await prisma.judgeAssignment.create({
          data: {
            judgeId: judge.id,
            teamId: team.id,
            hackathonId: hackathon.id
          }
        })
        console.log(`Assigned team ${team.name} to judge ${judge.id}`)
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
