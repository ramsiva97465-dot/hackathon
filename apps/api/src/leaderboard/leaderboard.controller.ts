import { Controller, Get, Post, Body, Query } from '@nestjs/common'
import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator'
import { LeaderboardService } from './leaderboard.service'
import { LeaderboardGateway } from './leaderboard.gateway'

class AdminScoreDto {
  @IsString()
  teamId: string

  @IsNumber()
  @IsOptional()
  score: number | null
}

class TvModeDto {
  @IsBoolean()
  enabled: boolean
}

class RevealStartDto {
  @IsNumber()
  @IsOptional()
  round?: number
}

@Controller('leaderboard')
export class LeaderboardController {
  constructor(
    private readonly service: LeaderboardService,
    private readonly gateway: LeaderboardGateway
  ) {}

  @Get()
  getLeaderboard(
    @Query('hackathonId') hackathonId?: string,
    @Query('round') round?: string
  ) {
    return this.service.getLeaderboard({
      hackathonId,
      round: round ? Number(round) : undefined
    })
  }

  @Get('tv-mode')
  getTvMode() {
    return { tvMode: this.gateway.getTvMode() }
  }

  @Post('tv-mode')
  async setTvMode(@Body() dto: TvModeDto) {
    const isEnabled = Boolean(dto.enabled)
    await this.gateway.broadcastTvMode(isEnabled)
    return { success: true, tvMode: isEnabled }
  }

  @Get('reveal-state')
  getRevealState() {
    return this.gateway.getRevealState()
  }

  @Post('reveal-start')
  async startReveal(@Body() dto: RevealStartDto) {
    await this.gateway.broadcastRevealEvent({
      round: dto.round || 2,
      type: 'TOP_20_COUNTDOWN',
      timestamp: Date.now()
    })
    return { success: true, isRevealing: true, round: dto.round || 2 }
  }


  @Post('reveal-stop')
  async stopReveal() {
    await this.gateway.broadcastStopReveal()
    return { success: true, isRevealing: false }
  }

  @Post('admin-score')
  async updateAdminScore(@Body() dto: AdminScoreDto) {
    await this.service.updateAdminScore(dto.teamId, dto.score)
    await this.gateway.broadcastLeaderboardUpdate()
    return { success: true }
  }
}
