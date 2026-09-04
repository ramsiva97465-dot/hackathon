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

function sumFromSheets(sheets: ScoreSheetWithScores[]) {
  return sheets.reduce((sum, sheet) => {
    const sheetTotal = sheet.scores.reduce((sSum, sc) => sSum + sc.score, 0)
    return sum + sheetTotal
  }, 0)
}

function averageFromSheets(sheets: ScoreSheetWithScores[]) {
  if (sheets.length === 0) return 0
  return sumFromSheets(sheets) / sheets.length
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
      isSpecialCategory: false,
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
            // Round 2: sum every judge's sheet. 5 judges → /50, 4 → /40, 3 → /30.
            totalScore = sumFromSheets(r2Sheets)
          }
        }
      } else {
        // Round 3 is reveal-only. Final ranking is always the Round 2 score
        // frozen at promotion. There is no third judging round.
        if (team.round2Score !== null && team.round2Score !== undefined) {
          totalScore = team.round2Score
          judgeCount = team.round2JudgeCount ?? 0
        } else {
          const r2Sheets = sheetsForRound(team.scoreSheets, 2)
          judgeCount = r2Sheets.length
          totalScore = sumFromSheets(r2Sheets)
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

    // This method backs a frequently-polled GET endpoint. Keep it read-only:
    // persisting every computed rank here previously launched hundreds of
    // concurrent upserts per request and exhausted the production DB pool.
    return sorted
  }

  /** Special Category board only — never mixed into the main Top 20 / Top 5 ranks. */
  async getSpecialLeaderboard(params?: { hackathonId?: string; round?: number }) {
    const hackathon = params?.hackathonId
      ? { id: params.hackathonId }
      : await this.prisma.hackathon.findFirst()

    if (!hackathon) return []

    const targetRound = params?.round ? Number(params.round) : 1
    const whereCondition: any = {
      hackathonId: hackathon.id,
      status: 'COMPETING',
      isSpecialCategory: true,
      round: targetRound === 2 ? 2 : 1,
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

    const round2JudgingStarted = targetRound === 2 && teams.some((team) => {
      if (team.round2Score !== null && team.round2Score !== undefined) return true
      if (team.adminScore !== null && team.adminScore !== undefined && (team.round || 1) === 2) return true
      return sheetsForRound(team.scoreSheets, 2).length > 0
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
      } else {
        if (team.round2Score !== null && team.round2Score !== undefined) {
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
            totalScore = sumFromSheets(r2Sheets)
          }
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
        isSpecialCategory: true,
        scores: [],
      }
    })

    return entries
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((entry, i) => ({ ...entry, rank: i + 1 }))
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
