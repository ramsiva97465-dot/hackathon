import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { LeaderboardGateway } from '../leaderboard/leaderboard.gateway'
import { getScoringRubricForRound } from '@hackathon/shared'

@Injectable()
export class ScoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leaderboardGateway: LeaderboardGateway
  ) {}

  async submitScore(judgeId: string, teamId: string, scores: { criteriaId: string; score: number }[], notes?: string) {
    // 1. Resolve judge ID (support either User ID or Judge Record ID)
    const judgeRecord = await this.prisma.judge.findUnique({ where: { id: judgeId } })
      || await this.prisma.judge.findFirst({ where: { id: judgeId } })
    const resolvedJudgeId = judgeRecord ? judgeRecord.id : judgeId

    const team = await this.prisma.team.findUnique({ where: { id: teamId } })
    if (!team) throw new NotFoundException('Team not found')
    const judgingRound = team.round || 1
    const rubric = getScoringRubricForRound(judgingRound)

    // 2. Fetch or create scoreSheet for this round only (Round 1 sheets stay frozen)
    let scoreSheet = await this.prisma.scoreSheet.findFirst({
      where: {
        judgeId: resolvedJudgeId,
        teamId,
        round: judgingRound,
      },
    })

    if (!scoreSheet) {
      scoreSheet = await this.prisma.scoreSheet.create({
        data: {
          judgeId: resolvedJudgeId,
          teamId,
          hackathonId: team.hackathonId,
          round: judgingRound,
        },
      })
    }

    // 3. Process each score criteria safely (round-aware rubric)
    for (const s of scores) {
      const rubricItem = rubric[s.criteriaId as keyof typeof rubric]
      if (!rubricItem) {
        throw new BadRequestException(
          `Unknown criteria "${s.criteriaId}" for Round ${judgingRound}. Use the Round ${judgingRound} score card.`
        )
      }

      const maxAllowed = rubricItem.max
      const numericScore = Number(s.score)
      if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > maxAllowed) {
        throw new BadRequestException(
          `Score for "${rubricItem.label}" must be between 0 and ${maxAllowed}.`
        )
      }

      let criteria = await this.prisma.scoreCriteria.findFirst({
        where: { hackathonId: scoreSheet.hackathonId, name: s.criteriaId }
      })

      if (!criteria) {
        criteria = await this.prisma.scoreCriteria.upsert({
          where: {
            hackathonId_name: {
              hackathonId: scoreSheet.hackathonId,
              name: s.criteriaId
            }
          },
          update: {
            description: rubricItem.description,
            maxScore: maxAllowed,
          },
          create: {
            hackathonId: scoreSheet.hackathonId,
            name: s.criteriaId,
            description: rubricItem.description,
            maxScore: maxAllowed,
            weight: 1.0
          }
        })
      } else if (criteria.maxScore !== maxAllowed || criteria.description !== rubricItem.description) {
        criteria = await this.prisma.scoreCriteria.update({
          where: { id: criteria.id },
          data: {
            maxScore: maxAllowed,
            description: rubricItem.description,
          },
        })
      }

      await this.prisma.score.upsert({
        where: {
          scoreSheetId_criteriaId: {
            scoreSheetId: scoreSheet.id,
            criteriaId: criteria.id,
          },
        },
        update: { score: numericScore },
        create: {
          scoreSheetId: scoreSheet.id,
          criteriaId: criteria.id,
          score: numericScore,
        },
      })
    }

    // 4. Mark scoreSheet as submitted
    await this.prisma.scoreSheet.update({
      where: { id: scoreSheet.id },
      data: {
        isSubmitted: true,
        submittedAt: new Date(),
        notes,
      },
    })

    // 5. Trigger websocket (non-blocking) — main + special boards stay in sync
    this.leaderboardGateway.broadcastLeaderboardUpdate().catch(err => {
      console.error('Failed to send leaderboard update:', err)
    })
    if (team.isSpecialCategory) {
      this.leaderboardGateway.broadcastSpecialLeaderboardUpdate().catch(err => {
        console.error('Failed to send special leaderboard update:', err)
      })
    }

    return { success: true, round: judgingRound }
  }
}
