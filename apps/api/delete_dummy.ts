import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Deleting all Team Members...')
  await prisma.teamMember.deleteMany({})
  
  console.log('Deleting all Scores...')
  await prisma.score.deleteMany({})
  
  console.log('Deleting all ScoreSheets...')
  await prisma.scoreSheet.deleteMany({})
  
  console.log('Deleting all Teams...')
  await prisma.team.deleteMany({})

  console.log('Deleting all Applications...')
  await prisma.application.deleteMany({})
  
  console.log('All dummy participants and teams removed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
