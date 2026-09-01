import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

type ScoreSheetWithScores = {
  isSubmitted: boolean
  round?: number | null
  scores: { score: number }[]
}

function sheetsForRound(sheets: ScoreSheetWithScores[], round: number) {
  return sheets.filter((s) => s.isSubmitted && (s.round || 1) === round)
}

function averageFromSheets(sheets: ScoreSheetWithScores[]) {
  if (sheets.length === 0) return 0
  const total = sheets.reduce((sum, sheet) => {
    const sheetTotal = sheet.scores.reduce((sSum, sc) => sSum + sc.score, 0)
    return sum + sheetTotal
  }, 0)
  return total / sheets.length
}

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
      status: 'COMPETING',
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

    // Until Round 2 judging starts, the Round 2 board is the Top 20 qualifier
    // announcement — ranked by frozen Round 1 scores, not empty R2 sheets.
    const round2JudgingStarted = targetRound === 2 && teams.some((team) => {
      if (team.round2Score !== null && team.round2Score !== undefined) return true
      if (team.adminScore !== null && team.adminScore !== undefined && (team.round || 1) === 2) return true
      return sheetsForRound(team.scoreSheets, 2).length > 0
    })

    // Same for the Grand Finale: finalists carry their frozen Round 2 result
    // until Round 3 judging produces its own scores.
    const round3JudgingStarted = targetRound === 3 && teams.some((team) => {
      if (team.adminScore !== null && team.adminScore !== undefined && (team.round || 1) === 3) return true
      return sheetsForRound(team.scoreSheets, 3).length > 0
    })

    const entries = teams.map((team) => {
      const bonus =
        (team as any).bonusVerifiedAt || (team as any).bonusVerifiedBy
          ? team.bonusPoints || 0
          : 0

      let totalScore = 0
      let judgeCount = 0

      if (targetRound === 1) {
        if (team.round1Score !== null && team.round1Score !== undefined) {
          totalScore = team.round1Score
          judgeCount = team.round1JudgeCount ?? 0
        } else {
          const r1Sheets = sheetsForRound(team.scoreSheets, 1)
          judgeCount = r1Sheets.length
          if (team.adminScore !== null && team.adminScore !== undefined && (team.round || 1) === 1) {
            totalScore = team.adminScore
          } else {
            totalScore = averageFromSheets(r1Sheets)
          }
          totalScore += bonus
        }
      } else if (targetRound === 2) {
        if ((team.round || 1) >= 3 && team.round2Score !== null && team.round2Score !== undefined) {
          totalScore = team.round2Score
          judgeCount = team.round2JudgeCount ?? 0
        } else if (!round2JudgingStarted) {
          if (team.round1Score !== null && team.round1Score !== undefined) {
            totalScore = team.round1Score
            judgeCount = team.round1JudgeCount ?? 0
          } else {
            const r1Sheets = sheetsForRound(team.scoreSheets, 1)
            judgeCount = r1Sheets.length
            totalScore = averageFromSheets(r1Sheets) + bonus
          }
        } else {
          const r2Sheets = sheetsForRound(team.scoreSheets, 2)
          judgeCount = r2Sheets.length
          if (team.adminScore !== null && team.adminScore !== undefined && (team.round || 1) === 2) {
            totalScore = team.adminScore
          } else {
            totalScore = averageFromSheets(r2Sheets)
          }
        }
      } else if (!round3JudgingStarted) {
        if (team.round2Score !== null && team.round2Score !== undefined) {
          totalScore = team.round2Score
          judgeCount = team.round2JudgeCount ?? 0
        } else {
          const r2Sheets = sheetsForRound(team.scoreSheets, 2)
          judgeCount = r2Sheets.length
          totalScore = averageFromSheets(r2Sheets)
        }
      } else {
        const r3Sheets = sheetsForRound(team.scoreSheets, 3)
        judgeCount = r3Sheets.length
        if (team.adminScore !== null && team.adminScore !== undefined && (team.round || 1) === 3) {
          totalScore = team.adminScore
        } else {
          totalScore = averageFromSheets(r3Sheets)
        }
      }

      return {
        teamId: team.id,
        teamName: team.name,
        college: (team as any).application?.college || 'Unknown',
        track: team.track.name,
        totalScore: Math.round(totalScore * 10) / 10,
        judgeCount,
        previousRank: (team as any).leaderboard?.rank ?? undefined,
        round: team.round,
        scores: [],
      }
    })

    // Sort by score desc and add rank
    const sorted = entries
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((entry, i) => ({ ...entry, rank: i + 1 }))

    // Persist only the team's current-round standing so historical R1 scores are not overwritten by R2 zeros
    await Promise.all(
      sorted
        .filter((e) => (e.round || 1) === targetRound)
        .map((e) =>
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
    if (score === 0) {
      const team = await this.prisma.team.findUnique({ where: { id: teamId } })
      const currentRound = team?.round || 1
      const scoreSheets = await this.prisma.scoreSheet.findMany({
        where: { teamId, round: currentRound },
      })
      const sheetIds = scoreSheets.map(s => s.id)
      
      if (sheetIds.length > 0) {
        await this.prisma.score.deleteMany({ where: { scoreSheetId: { in: sheetIds } } })
        await this.prisma.scoreSheet.deleteMany({ where: { id: { in: sheetIds } } })
      }
      
      await this.prisma.team.update({
        where: { id: teamId },
        data: { adminScore: null },
      })
    } else {
      await this.prisma.team.update({
        where: { id: teamId },
        data: { adminScore: score },
      })
    }
    await this.getLeaderboard({ round: 1 })
  }
}
