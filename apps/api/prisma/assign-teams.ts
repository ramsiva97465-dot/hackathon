import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🤖 Assigning 5 dummy teams to ALL judges so you can test them...')

  const judges = await prisma.judge.findMany()
  
  if (judges.length === 0) {
    console.log('No judges found in the system!')
    return
  }

  const teams = await prisma.team.findMany({
    take: 5
  })

  for (const judge of judges) {
    console.log(`Assigning teams to Judge: ${judge.id}`)
    
    for (const team of teams) {
      const existing = await prisma.judgeAssignment.findFirst({
        where: { judgeId: judge.id, teamId: team.id }
      })

      if (!existing) {
        await prisma.judgeAssignment.create({
          data: {
            hackathonId: team.hackathonId,
            judgeId: judge.id,
            teamId: team.id
          }
        })
      }
    }
  }

  console.log('✅ Teams successfully assigned to all judges!')
}

main()
  .catch((e) => {
    console.error('Error assigning teams:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
