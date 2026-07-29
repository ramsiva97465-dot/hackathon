import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeaderboard(params?: { hackathonId?: string; round?: number }) {
    // Locate hackathon
    const hackathon = params?.hackathonId
      ? { id: params.hackathonId }
      : await this.prisma.hackathon.findFirst()

    if (!hackathon) return []

    const targetRound = params?.round ? Number(params.round) : 1
    const whereCondition: any = {
      hackathonId: hackathon.id,
      status: 'COMPETING'
    }

    if (targetRound === 3) {
      whereCondition.round = 3
    } else if (targetRound === 2) {
      whereCondition.round = { in: [2, 3] }
    }

    const teams = await this.prisma.team.findMany({
      where: whereCondition,
      include: {
        track: true,
        application: { select: { college: true } },
        scoreSheets: {
          where: { isSubmitted: true },
          include: { scores: true },
        },
        leaderboard: { select: { rank: true } },
      },
    })

    const entries = teams.map((team) => {
      // Calculate overall score: average of submitted score sheets
      const submittedSheets = team.scoreSheets.filter((s) => s.isSubmitted)
      
      let totalScore = 0
      if (team.adminScore !== null && team.adminScore !== undefined) {
        totalScore = team.adminScore
      } else if (submittedSheets.length > 0) {
        const total = submittedSheets.reduce((sum, sheet) => {
          const sheetTotal = sheet.scores.reduce((sSum, sc) => sSum + sc.score, 0)
          return sum + sheetTotal
        }, 0)
        totalScore = total / submittedSheets.length
      }

      // Add bonus points
      totalScore += team.bonusPoints || 0

      return {
        teamId: team.id,
        teamName: team.name,
        college: (team as any).application?.college || 'Unknown',
        track: team.track.name,
        totalScore: Math.round(totalScore * 10) / 10,
        judgeCount: submittedSheets.length,
        previousRank: (team as any).leaderboard?.rank ?? undefined,
        round: team.round,
        scores: [],
      }
    })

    // Sort by score desc and add rank
    const sorted = entries
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((entry, i) => ({ ...entry, rank: i + 1 }))

    // Update leaderboard table
    await Promise.all(
      sorted.map((e) =>
        this.prisma.leaderboard.upsert({
          where: { hackathonId_teamId: { hackathonId: hackathon.id, teamId: e.teamId } },
          create: {
            hackathonId: hackathon.id,
            teamId: e.teamId,
            rank: e.rank,
            overallScore: e.totalScore,
            judgeCount: e.judgeCount,
          },
          update: {
            rank: e.rank,
            overallScore: e.totalScore,
            judgeCount: e.judgeCount,
          },
        })
      )
    )

    return sorted
  }

  async getEntry(teamId: string) {
    const hackathon = await this.prisma.hackathon.findFirst()
    if (!hackathon) return null
    return this.prisma.leaderboard.findUnique({
      where: { hackathonId_teamId: { hackathonId: hackathon.id, teamId } },
    })
  }

  async updateAdminScore(teamId: string, score: number | null) {
    await this.prisma.team.update({
      where: { id: teamId },
      data: { adminScore: score },
    })
    // Re-calculate the leaderboard entry for this team specifically
    // but the easiest way to keep ranks correct is to recalculate the whole leaderboard
    await this.getLeaderboard()
  }
}
