import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const totalTeams = await this.prisma.team.count()
    const competingTeams = await this.prisma.team.count({
      where: { status: 'COMPETING' }
    })
    const submittedTeams = await this.prisma.team.count({
      where: {
        OR: [
          { projectTitle: { not: null } },
          { agentName: { not: null } },
          { agentSolution: { not: null } },
          { agentPhoneNumber: { not: null } }
        ]
      }
    })
    const totalMembers = await this.prisma.teamMember.count()
    const activeJudges = await this.prisma.judge.count()

    // Track allocation
    const tracks = await this.prisma.track.findMany({
      include: {
        _count: {
          select: { teams: true }
        }
      }
    })

    const trackAllocation = tracks.map(t => ({
      name: t.name,
      count: t._count.teams
    }))

    // Recent Teams
    const recentTeams = await this.prisma.team.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        track: true,
        members: true
      }
    })

    const formattedRecentTeams = recentTeams.map(t => ({
      name: t.name,
      track: t.track.name,
      membersCount: t.members.length,
      createdAt: t.createdAt
    }))

    return {
      success: true,
      data: {
        stats: {
          totalTeams,
          competingTeams,
          submittedTeams,
          totalMembers,
          activeJudges
        },
        trackAllocation,
        recentTeams: formattedRecentTeams
      }
    }
  }
}

