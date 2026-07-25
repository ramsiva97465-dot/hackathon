import { Controller, Get, Post, Body, Query } from '@nestjs/common'
import { IsString, IsNumber, IsOptional } from 'class-validator'
import { LeaderboardService } from './leaderboard.service'
import { LeaderboardGateway } from './leaderboard.gateway'

class AdminScoreDto {
  @IsString()
  teamId: string

  @IsNumber()
  @IsOptional()
  score: number | null
}

@Controller('leaderboard')
export class LeaderboardController {
  constructor(
    private readonly service: LeaderboardService,
    private readonly gateway: LeaderboardGateway
  ) {}

  @Get()
  getLeaderboard(@Query('hackathonId') hackathonId?: string) {
    return this.service.getLeaderboard(hackathonId ? { hackathonId } : undefined)
  }

  @Post('admin-score')
  async updateAdminScore(@Body() dto: AdminScoreDto) {
    await this.service.updateAdminScore(dto.teamId, dto.score)
    await this.gateway.broadcastLeaderboardUpdate()
    return { success: true }
  }
}
