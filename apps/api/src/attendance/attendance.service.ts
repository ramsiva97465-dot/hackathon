import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { LeaderboardService } from '../leaderboard/leaderboard.service'

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private leaderboardService: LeaderboardService
  ) {}

  async lookup(query: string) {
    let teamId = query
    let memberId: string | null = null

    // Parse JSON or SNAPSERVE prefix if passed from QR code scanner
    try {
      if (query.startsWith('{')) {
        const parsed = JSON.parse(query)
        teamId = parsed.teamId || query
        memberId = parsed.memberId || null
      } else if (query.startsWith('SNAPSERVE:')) {
        const parts = query.split(':')
        teamId = parts[1] || query
        memberId = parts[2] || null
      }
    } catch (e) {
      // Fallback to literal query string
    }

    // Try finding team by ID, table number, or team name
    const team = await this.prisma.team.findFirst({
      where: {
        OR: [
          { id: teamId },
          { tableNumber: { equals: query, mode: 'insensitive' } },
          { name: { equals: query, mode: 'insensitive' } },
          { members: { some: { id: query } } },
          { members: { some: { email: { equals: query, mode: 'insensitive' } } } }
        ]
      },
      include: {
        track: true,
        members: true
      }
    })

    if (!team) {
      throw new NotFoundException(`Team or Member not found for query: "${query}"`)
    }

    return {
      team,
      scannedMemberId: memberId || team.members[0]?.id || null
    }
  }

  async markMemberAttendance(memberId: string, isPresent: boolean, adminUserId?: string) {
    const member = await this.prisma.teamMember.update({
      where: { id: memberId },
      data: {
        isPresent,
        checkedInAt: isPresent ? new Date() : null,
        checkedInBy: adminUserId || 'ADMIN'
      },
      include: { team: true }
    })

    // If member belongs to a team, update team attendance status
    if (member.teamId) {
      const anyPresent = await this.prisma.teamMember.findFirst({
        where: { teamId: member.teamId, isPresent: true }
      })

      await this.prisma.team.update({
        where: { id: member.teamId },
        data: {
          attendanceStatus: anyPresent ? 'CHECKED_IN' : 'PENDING'
        }
      })
    }

    return member
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
        bonusVerifiedAt: new Date()
      },
      include: { track: true, members: true }
    })

    // Recalculate leaderboard scores across all rounds
    try {
      await this.leaderboardService.getLeaderboard({ round: 1 })
      await this.leaderboardService.getLeaderboard({ round: 2 })
      await this.leaderboardService.getLeaderboard({ round: 3 })
    } catch (err) {
      console.error('Error recalculating leaderboard score on bonus update:', err)
    }

    return team
  }
}
