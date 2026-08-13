import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'judge@theaitel.com' } })
  if (user) {
    await prisma.user.delete({ where: { id: user.id } })
    console.log('Deleted successfully again!')
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
