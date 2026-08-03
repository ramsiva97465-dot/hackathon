import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  trustedOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3002',
    'http://localhost:5173',
    'https://voiceathon.snapserve.ai',
    process.env.FRONTEND_URL ?? 'http://localhost:3000',
  ],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 1,
  },
  cookie: {
    secure: process.env.NODE_ENV === 'production',
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: 'ROLE_CHANGED', // default setup
              entityType: 'USER',
              entityId: user.id,
              newValue: { role: (user as any).role },
            },
          })
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          await prisma.auditLog.create({
            data: {
              userId: session.userId,
              action: 'USER_LOGGED_IN',
              entityType: 'SESSION',
              entityId: session.id,
              ipAddress: session.ipAddress,
              userAgent: session.userAgent,
            },
          })
        },
      },
      delete: {
        before: async (session) => {
          await prisma.auditLog.create({
            data: {
              userId: session.userId,
              action: 'USER_LOGGED_OUT',
              entityType: 'SESSION',
              entityId: session.id,
              ipAddress: session.ipAddress,
              userAgent: session.userAgent,
            },
          })
        },
      },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'ADMIN',
      },
    },
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: ['x-forwarded-for'],
      trustedProxies: ['*'],
    },
  },
})
export type Auth = typeof auth
