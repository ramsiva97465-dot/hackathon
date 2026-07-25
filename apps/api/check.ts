import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const apps = await prisma.application.findMany()
  console.log('Apps:', apps.map(a => ({ id: a.id, name: a.teamName, status: a.status })))

  const teams = await prisma.team.findMany()
  console.log('Teams:', teams.map(t => ({ id: t.id, name: t.name })))
}
main().finally(() => prisma.$disconnect())
