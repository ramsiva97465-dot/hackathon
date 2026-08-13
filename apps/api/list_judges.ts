import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const judges = await prisma.judge.findMany({
    include: { user: true }
  })
  
  console.log('All Judges:', judges.map(j => ({ id: j.id, email: j.user.email, name: j.user.name })))
}

main().catch(console.error).finally(() => prisma.$disconnect())
