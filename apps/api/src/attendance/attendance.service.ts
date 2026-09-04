import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { LeaderboardService } from '../leaderboard/leaderboard.service'

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private leaderboardService: LeaderboardService
  ) {}

  private parseQrQuery(query: string): { teamId: string | null; memberId: string | null; raw: string } {
    const raw = (query || '').trim()
    let teamId: string | null = null
    let memberId: string | null = null

    try {
      if (raw.startsWith('{')) {
        const parsed = JSON.parse(raw)
        teamId = parsed.teamId || parsed.teamID || null
        memberId = parsed.memberId || parsed.memberID || null
      } else if (raw.toUpperCase().startsWith('SNAPSERVE:')) {
        const parts = raw.split(':')
        teamId = parts[1]?.trim() || null
        memberId = parts[2]?.trim() || null
      }
    } catch {
      // Fallback to literal query string
    }

    return { teamId, memberId, raw }
  }

  private teamInclude() {
    return {
      track: true,
      members: {
        orderBy: { createdAt: 'asc' as const },
      },
    }
  }

  async lookup(query: string) {
    const { teamId, memberId, raw } = this.parseQrQuery(query)
    if (!raw) {
      throw new BadRequestException('Lookup query is required')
    }

    const include = this.teamInclude()
    let team =
      (teamId
        ? await this.prisma.team.findUnique({ where: { id: teamId }, include })
        : null)
      || await this.prisma.team.findUnique({ where: { id: raw }, include }).catch(() => null)
      || await this.prisma.team.findFirst({
          where: { tableNumber: { equals: raw, mode: 'insensitive' } },
          include,
        })
      || await this.prisma.team.findFirst({
          where: { name: { equals: raw, mode: 'insensitive' } },
          include,
        })
      || await this.prisma.team.findFirst({
          where: { members: { some: { id: memberId || raw } } },
          include,
        })
      || await this.prisma.team.findFirst({
          where: { members: { some: { email: { equals: raw, mode: 'insensitive' } } } },
          include,
        })
      || await this.prisma.team.findFirst({
          where: { members: { some: { name: { equals: raw, mode: 'insensitive' } } } },
          include,
        })

    // Fuzzy desk fallbacks
    if (!team) {
      const tableHint = raw.replace(/^table\s*/i, '').trim()
      team =
        await this.prisma.team.findFirst({
          where: { tableNumber: { contains: tableHint, mode: 'insensitive' } },
          include,
        })
        || await this.prisma.team.findFirst({
          where: { name: { contains: raw, mode: 'insensitive' } },
          include,
        })
        || await this.prisma.team.findFirst({
          where: { members: { some: { name: { contains: raw, mode: 'insensitive' } } } },
          include,
        })
    }

    if (!team) {
      throw new NotFoundException(`Team or Member not found for query: "${raw}"`)
    }

    const matchedMember =
      (memberId && team.members.find((m) => m.id === memberId))
      || team.members.find((m) => m.id === raw)
      || team.members.find((m) => m.email?.toLowerCase() === raw.toLowerCase())
      || team.members.find((m) => m.name?.toLowerCase() === raw.toLowerCase())
      || team.members[0]
      || null

    return {
      success: true,
      team,
      scannedMemberId: matchedMember?.id || null,
    }
  }

  async markMemberAttendance(memberId: string, isPresent: boolean, adminUserId?: string) {
    if (!memberId?.trim()) {
      throw new BadRequestException('memberId is required')
    }

    const existing = await this.prisma.teamMember.findUnique({ where: { id: memberId } })
    if (!existing) {
      throw new NotFoundException('Team member not found')
    }

    const member = await this.prisma.teamMember.update({
      where: { id: memberId },
      data: {
        isPresent: Boolean(isPresent),
        checkedInAt: isPresent ? new Date() : null,
        checkedInBy: isPresent ? (adminUserId || 'ADMIN') : null,
      },
      include: { team: true },
    })

    let attendanceStatus: string | null = null
    if (member.teamId) {
      const presentCount = await this.prisma.teamMember.count({
        where: { teamId: member.teamId, isPresent: true },
      })
      attendanceStatus = presentCount > 0 ? 'CHECKED_IN' : 'PENDING'
      await this.prisma.team.update({
        where: { id: member.teamId },
        data: { attendanceStatus },
      })
    }

    return {
      success: true,
      data: member,
      attendanceStatus,
    }
  }

  async verifyTeamBonus(
    teamId: string,
    bonusPoints: number,
    adminUserId?: string
  ) {
    const team = await this.prisma.team.update({
      where: { id: teamId },
      data: {
        bonusPoints,
        bonusVerifiedBy: adminUserId || 'ADMIN',
        bonusVerifiedAt: new Date(),
      },
      include: { track: true, members: true },
    })

    try {
      await this.leaderboardService.getLeaderboard({ round: 1 })
      await this.leaderboardService.getLeaderboard({ round: 2 })
      await this.leaderboardService.getLeaderboard({ round: 3 })
    } catch (err) {
      console.error('Error recalculating leaderboard score on bonus update:', err)
    }

    return { success: true, data: team }
  }
}
