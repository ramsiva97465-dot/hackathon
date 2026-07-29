import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { LeaderboardGateway } from '../leaderboard/leaderboard.gateway'
import { SCORING_RUBRIC } from '@hackathon/shared'

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

    // 2. Fetch or create scoreSheet
    let scoreSheet = await this.prisma.scoreSheet.findUnique({
      where: {
        judgeId_teamId: { judgeId: resolvedJudgeId, teamId },
      },
    })

    if (!scoreSheet) {
      const team = await this.prisma.team.findUnique({ where: { id: teamId } })
      if (!team) throw new NotFoundException('Team not found')

      scoreSheet = await this.prisma.scoreSheet.create({
        data: {
          judgeId: resolvedJudgeId,
          teamId,
          hackathonId: team.hackathonId,
        },
      })
    }

    // 3. Process each score criteria safely
    for (const s of scores) {
      let criteria = await this.prisma.scoreCriteria.findFirst({
        where: { hackathonId: scoreSheet.hackathonId, name: s.criteriaId }
      })

      if (!criteria) {
        const rubricItem = SCORING_RUBRIC[s.criteriaId as keyof typeof SCORING_RUBRIC]
        criteria = await this.prisma.scoreCriteria.upsert({
          where: {
            hackathonId_name: {
              hackathonId: scoreSheet.hackathonId,
              name: s.criteriaId
            }
          },
          update: {},
          create: {
            hackathonId: scoreSheet.hackathonId,
            name: s.criteriaId,
            description: rubricItem?.description || s.criteriaId,
            maxScore: rubricItem?.max || 10,
            weight: 1.0
          }
        })
      }

      await this.prisma.score.upsert({
        where: {
          scoreSheetId_criteriaId: {
            scoreSheetId: scoreSheet.id,
            criteriaId: criteria.id,
          },
        },
        update: { score: s.score },
        create: {
          scoreSheetId: scoreSheet.id,
          criteriaId: criteria.id,
          score: s.score,
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

    // 5. Trigger websocket (non-blocking)
    this.leaderboardGateway.broadcastLeaderboardUpdate().catch(err => {
      console.error('Failed to send leaderboard update:', err)
    })

    return { success: true }
  }
}
