import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const teamNames = ['Eclipse', 'clara', 'matrixminds07']
  
  const teams = await prisma.team.findMany({
    where: {
      name: {
        in: teamNames,
        mode: 'insensitive'
      }
    },
    include: {
      members: true,
      application: true,
      track: true,
      scoreSheets: {
        include: {
          judge: {
            include: {
              user: true
            }
          },
          scores: {
            include: {
              criteria: true
            }
          }
        }
      }
    }
  })

  console.log(JSON.stringify(teams, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
