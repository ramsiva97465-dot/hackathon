import { PrismaClient } from '@prisma/client'

async function test(name: string, url: string) {
  console.log(`\nTesting ${name}...`)
  const p = new PrismaClient({ datasources: { db: { url } } })
  try {
    const teams = await p.team.count()
    console.log(`✅ ${name} SUCCESS! Team count:`, teams)
    return true
  } catch (err: any) {
    console.error(`❌ ${name} ERROR:`, err.message)
    return false
  } finally {
    await p.$disconnect()
  }
}

async function main() {
  await test('Neon Pooler', 'postgresql://neondb_owner:npg_ZRF96scSpULE@ep-wild-dawn-ay4chne8-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require')
  await test('Neon Direct', 'postgresql://neondb_owner:npg_ZRF96scSpULE@ep-wild-dawn-ay4chne8.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require')
  await test('Railway Proxy', 'postgresql://postgres:nTrYxPSfjgNgiRvDGXTzhzUMrFJkbhJO@tokaido.proxy.rlwy.net:50474/railway')
}

main()
