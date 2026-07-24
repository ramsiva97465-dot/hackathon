import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

interface AuditLogPayload {
  userId: string
  action: string
  entityType: string
  entityId: string
  oldValue?: any
  newValue?: any
  ipAddress?: string
  userAgent?: string
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(payload: AuditLogPayload) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          userId: payload.userId,
          action: payload.action,
          entityType: payload.entityType,
          entityId: payload.entityId,
          oldValue: payload.oldValue ?? null,
          newValue: payload.newValue ?? null,
          ipAddress: payload.ipAddress ?? null,
          userAgent: payload.userAgent ?? null,
        },
      })
    } catch (err) {
      console.error('Failed to write audit log:', err)
    }
  }

  async findAll() {
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return { success: true, data: logs }
  }
}
