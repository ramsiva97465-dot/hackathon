import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const teams = await this.prisma.team.findMany({
      include: {
        application: true,
        track: true,
        members: true,
        assignments: true,
        leaderboard: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    const totalJudges = await this.prisma.judge.count()

    const mapped = teams.map(t => ({
      id: t.id,
      name: t.name,
      college: t.application?.college || 'Unknown',
      track: t.track.slug === 'real-world-deployment' ? 'REAL_WORLD_DEPLOYMENT' : 
             t.track.slug === 'multimodal-ai' ? 'MULTIMODAL_AI' : 'VOICE_AI_AGENT',
      members: t.members.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        role: m.role,
        linkedin: m.linkedin,
        github: m.github
      })),
      judgesAssigned: t.assignments.length,
      totalJudges,
      avgScore: t.leaderboard[0]?.overallScore || null,
      rank: t.leaderboard[0]?.rank || null,
      status: t.status,
      tableNumber: t.tableNumber,
    }))

    return { success: true, data: mapped }
  }

  async assignJudge(teamId: string, judgeId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } })
    if (!team) throw new Error('Team not found')

    const assignment = await this.prisma.judgeAssignment.create({
      data: {
        hackathonId: team.hackathonId,
        judgeId,
        teamId,
      }
    })

    // Also create the empty score sheet
    await this.prisma.scoreSheet.create({
      data: {
        hackathonId: team.hackathonId,
        judgeId,
        teamId,
      }
    })

    return { success: true, data: assignment }
  }

  async updateTableNumber(teamId: string, tableNumber: string) {
    const team = await this.prisma.team.update({
      where: { id: teamId },
      data: { tableNumber },
    })
    return { success: true, data: team }
  }
}
