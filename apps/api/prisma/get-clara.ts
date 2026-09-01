import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const clara = await prisma.team.findFirst({
    where: { name: { equals: 'clara', mode: 'insensitive' } },
    include: {
      members: true,
      track: true
    }
  })
  console.log(JSON.stringify(clara, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
