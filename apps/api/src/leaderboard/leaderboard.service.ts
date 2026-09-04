import { Injectable, NotFoundException } from '@nestjs/common'
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

  async getLeaderboard(params?: { hackathonId?: string; round?: number; liveScores?: boolean }) {
    // Locate hackathon
    const hackathon = params?.hackathonId
      ? { id: params.hackathonId }
      : await this.prisma.hackathon.findFirst()

    if (!hackathon) return []

    const targetRound = params?.round ? Number(params.round) : 1
    // Public Top 20 LCD always shows frozen Round 1 qualifier scores.
    // Admin / ops pass liveScores=true to inspect live Round 2 judging.
    const useLiveRound2Scores = Boolean(params?.liveScores)
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

    const entries = teams.map((team) => {
      const bonus =
        (team as any).bonusVerifiedAt || (team as any).bonusVerifiedBy
          ? team.bonusPoints || 0
          : 0
      const teamRound = team.round || 1
      const hasAdminOverride = team.adminScore !== null && team.adminScore !== undefined

      let totalScore = 0
      let judgeCount = 0

      if (targetRound === 1) {
        const r1Sheets = sheetsForRound(team.scoreSheets, 1)
        judgeCount = team.round1JudgeCount ?? r1Sheets.length
        // Admin override always wins for teams still in Round 1 scoring.
        if (hasAdminOverride && teamRound === 1) {
          totalScore = team.adminScore!
        } else if (team.round1Score !== null && team.round1Score !== undefined) {
          totalScore = team.round1Score
          judgeCount = team.round1JudgeCount ?? 0
        } else {
          totalScore = averageFromSheets(r1Sheets) + bonus
        }
      } else if (targetRound === 2) {
        if (useLiveRound2Scores) {
          const r2Sheets = sheetsForRound(team.scoreSheets, 2)
          // Admin / ops live R2 board: override beats frozen R2 and sheets.
          if (hasAdminOverride && teamRound >= 2) {
            totalScore = team.adminScore!
            judgeCount = team.round2JudgeCount ?? r2Sheets.length
          } else if (teamRound >= 3 && team.round2Score !== null && team.round2Score !== undefined) {
            totalScore = team.round2Score
            judgeCount = team.round2JudgeCount ?? 0
          } else if (team.round2Score !== null && team.round2Score !== undefined) {
            totalScore = team.round2Score
            judgeCount = team.round2JudgeCount ?? r2Sheets.length
          } else {
            judgeCount = r2Sheets.length
            // Round 2: sum every judge's sheet. 5 judges → /50, 4 → /40, 3 → /30.
            totalScore = sumFromSheets(r2Sheets)
          }
        } else if (team.round1Score !== null && team.round1Score !== undefined) {
          // Qualifier announcement board: always Round 1, even after R2 judging.
          totalScore = team.round1Score
          judgeCount = team.round1JudgeCount ?? 0
        } else {
          const r1Sheets = sheetsForRound(team.scoreSheets, 1)
          judgeCount = r1Sheets.length
          totalScore = averageFromSheets(r1Sheets) + bonus
        }
      } else {
        // Round 3 is reveal-only. Prefer admin override, else frozen Round 2 score.
        const r2Sheets = sheetsForRound(team.scoreSheets, 2)
        if (hasAdminOverride) {
          totalScore = team.adminScore!
          judgeCount = team.round2JudgeCount ?? r2Sheets.length
        } else if (team.round2Score !== null && team.round2Score !== undefined) {
          totalScore = team.round2Score
          judgeCount = team.round2JudgeCount ?? 0
        } else {
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
        adminOverride: hasAdminOverride && (
          (targetRound === 1 && teamRound === 1)
          || (targetRound === 2 && useLiveRound2Scores && teamRound >= 2)
          || targetRound === 3
        ),
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
    // Special R1 = ALL special teams ranked by Round 1 scores (even after promote).
    // Special R2 = shortlisted Top 5 only (team.round >= 2), live Round 2 marks.
    const whereCondition: any = {
      hackathonId: hackathon.id,
      status: 'COMPETING',
      isSpecialCategory: true,
    }
    if (targetRound === 2) {
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

    const round2JudgingStarted = targetRound === 2 && teams.some((team) => {
      if (team.round2Score !== null && team.round2Score !== undefined) return true
      if (team.adminScore !== null && team.adminScore !== undefined && (team.round || 1) >= 2) return true
      return sheetsForRound(team.scoreSheets, 2).length > 0
    })

    const entries = teams.map((team) => {
      const bonus =
        (team as any).bonusVerifiedAt || (team as any).bonusVerifiedBy
          ? team.bonusPoints || 0
          : 0
      const teamRound = team.round || 1
      const hasAdminOverride = team.adminScore !== null && team.adminScore !== undefined

      let totalScore = 0
      let judgeCount = 0

      if (targetRound === 1) {
        const r1Sheets = sheetsForRound(team.scoreSheets, 1)
        // Prefer submitted R1 sheets so a leftover round1Score of 0 cannot hide real marks.
        if (hasAdminOverride && teamRound === 1) {
          totalScore = team.adminScore!
          judgeCount = team.round1JudgeCount ?? r1Sheets.length
        } else if (r1Sheets.length > 0) {
          judgeCount = r1Sheets.length
          totalScore = averageFromSheets(r1Sheets) + bonus
        } else if (team.round1Score !== null && team.round1Score !== undefined) {
          totalScore = team.round1Score
          judgeCount = team.round1JudgeCount ?? 0
        } else {
          totalScore = bonus
          judgeCount = 0
        }
      } else {
        // Live Round 2 board for the special Top 5 shortlist — never reuse R1 marks as R2 scores.
        const r2Sheets = sheetsForRound(team.scoreSheets, 2)
        if (hasAdminOverride && teamRound >= 2) {
          totalScore = team.adminScore!
          judgeCount = team.round2JudgeCount ?? r2Sheets.length
        } else if (r2Sheets.length > 0) {
          judgeCount = r2Sheets.length
          totalScore = sumFromSheets(r2Sheets)
        } else if (team.round2Score !== null && team.round2Score !== undefined) {
          totalScore = team.round2Score
          judgeCount = team.round2JudgeCount ?? 0
        } else {
          // Fresh after promote: Round 2 starts at 0 until judges submit R2 sheets.
          judgeCount = 0
          totalScore = 0
        }
      }

      // Qualifier rank seed (frozen R1) — used only to keep a stable order before R2 scoring.
      const qualifierScore =
        team.round1Score !== null && team.round1Score !== undefined
          ? team.round1Score
          : averageFromSheets(sheetsForRound(team.scoreSheets, 1)) + bonus

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
        adminOverride:
          hasAdminOverride &&
          ((targetRound === 1 && teamRound === 1) || (targetRound === 2 && teamRound >= 2)),
        scores: [],
        _qualifierScore: qualifierScore,
      }
    })

    return entries
      .sort((a, b) => {
        // Once R2 scoring starts, rank by live R2 score; otherwise keep R1 promote order.
        if (round2JudgingStarted) return b.totalScore - a.totalScore
        return (b as any)._qualifierScore - (a as any)._qualifierScore
      })
      .map(({ _qualifierScore, ...entry }, i) => ({ ...entry, rank: i + 1 }))
  }

  async getEntry(teamId: string) {
    const hackathon = await this.prisma.hackathon.findFirst()
    if (!hackathon) return null
    return this.prisma.leaderboard.findUnique({
      where: { hackathonId_teamId: { hackathonId: hackathon.id, teamId } },
    })
  }

  async updateAdminScore(teamId: string, score: number | null) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } })
    if (!team) throw new NotFoundException('Team not found')

    const teamRound = team.round || 1

    if (score === null) {
      // Clear override only — keep frozen round scores / judge sheets intact.
      await this.prisma.team.update({
        where: { id: teamId },
        data: { adminScore: null },
      })
      return
    }

    // Persist override AND sync the frozen score field so LCD / promote / boards match.
    const data: {
      adminScore: number
      round1Score?: number
      round2Score?: number
    } = { adminScore: score }

    if (teamRound <= 1) {
      data.round1Score = score
    } else {
      data.round2Score = score
    }

    await this.prisma.team.update({
      where: { id: teamId },
      data,
    })
  }

  /** Persisted flag — survives API restarts / multi-instance (unlike gateway memory). */
  async getCertificatesReleasedFlag(): Promise<boolean> {
    const setting = await this.prisma.setting.findFirst()
    if (!setting) return false
    const config = (setting.config as Record<string, unknown> | null) || {}
    return Boolean(config.certificatesReleased)
  }

  async setCertificatesReleasedFlag(released: boolean): Promise<boolean> {
    const hackathon = await this.prisma.hackathon.findFirst()
    if (!hackathon) return released

    const existing = await this.prisma.setting.findUnique({
      where: { hackathonId: hackathon.id },
    })

    if (existing) {
      const prev = (existing.config as Record<string, unknown> | null) || {}
      await this.prisma.setting.update({
        where: { id: existing.id },
        data: { config: { ...prev, certificatesReleased: released } },
      })
    } else {
      await this.prisma.setting.create({
        data: {
          hackathonId: hackathon.id,
          registrationWindowStart: hackathon.registrationStartDate,
          registrationWindowEnd: hackathon.registrationEndDate,
          scoringWindowStart: hackathon.startDate,
          scoringWindowEnd: hackathon.endDate,
          config: { certificatesReleased: released },
        },
      })
    }

    return released
  }
}
