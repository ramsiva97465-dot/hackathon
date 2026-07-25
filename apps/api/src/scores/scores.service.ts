import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { LeaderboardGateway } from '../leaderboard/leaderboard.gateway'

@Injectable()
export class ScoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leaderboardGateway: LeaderboardGateway
  ) {}

  async submitScore(judgeId: string, teamId: string, scores: { criteriaId: string; score: number }[]) {
    // Upsert the score sheet to ensure it exists
    let scoreSheet = await this.prisma.scoreSheet.findUnique({
      where: {
        judgeId_teamId: {
          judgeId,
          teamId,
        },
      },
    })

    if (!scoreSheet) {
      // Find the hackathon ID from the team
      const team = await this.prisma.team.findUnique({ where: { id: teamId } })
      if (!team) throw new NotFoundException('Team not found')

      scoreSheet = await this.prisma.scoreSheet.create({
        data: {
          judgeId,
          teamId,
          hackathonId: team.hackathonId,
        },
      })
    }

    // Save individual scores
    for (const s of scores) {
      // Find or create the criteria by name (since the frontend passes criteriaKey as ID)
      let criteria = await this.prisma.scoreCriteria.findFirst({
        where: { name: s.criteriaId, hackathonId: scoreSheet.hackathonId }
      })
      if (!criteria) {
        criteria = await this.prisma.scoreCriteria.create({
          data: {
            name: s.criteriaId,
            hackathonId: scoreSheet.hackathonId,
            maxScore: 10,
            weight: 1.0,
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
        update: {
          score: s.score,
        },
        create: {
          scoreSheetId: scoreSheet.id,
          criteriaId: criteria.id,
          score: s.score,
        },
      })
    }

    // Mark as submitted
    await this.prisma.scoreSheet.update({
      where: { id: scoreSheet.id },
      data: {
        isSubmitted: true,
        submittedAt: new Date(),
      },
    })

    // Trigger websocket
    await this.leaderboardGateway.broadcastLeaderboardUpdate()

    return { success: true }
  }
}
