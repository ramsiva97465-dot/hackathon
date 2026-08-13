import { PrismaClient } from '@prisma/client'
import { hashPassword } from 'better-auth/crypto'

const prisma = new PrismaClient()

async function main() {
  const email = 'suman@vobiz.ai'
  const newPass = 'vobiz@@2026'
  const hash = await hashPassword(newPass)

  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } })
  if (!user) {
    console.log('User not found')
    return
  }

  const accounts = await prisma.account.findMany({ where: { userId: user.id } })
  if (accounts.length === 0) {
    await prisma.account.create({
      data: {
        id: 'acc_' + user.id,
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        password: hash
      }
    })
  } else {
    for (const acc of accounts) {
      await prisma.account.update({
        where: { id: acc.id },
        data: { password: hash }
      })
    }
  }

  console.log(`Successfully reset password for ${user.email} to: ${newPass}`)
}

main().finally(() => prisma.$disconnect())
