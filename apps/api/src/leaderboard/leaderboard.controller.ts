import { Controller, Get, Post, Body, Query } from '@nestjs/common'
import { IsString, IsNumber, IsOptional, IsBoolean, ValidateIf } from 'class-validator'
import { LeaderboardService } from './leaderboard.service'
import { LeaderboardGateway } from './leaderboard.gateway'

class AdminScoreDto {
  @IsString()
  teamId: string

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsNumber()
  @IsOptional()
  score: number | null

  /** Which frozen score field to sync (1 = Round 1 / Special R1, 2 = Round 2 / Special R2). */
  @IsNumber()
  @IsOptional()
  scoreRound?: number
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
    @Query('round') round?: string,
    @Query('liveScores') liveScores?: string
  ) {
    return this.service.getLeaderboard({
      hackathonId,
      round: round ? Number(round) : undefined,
      liveScores: liveScores === 'true' || liveScores === '1',
    })
  }

  @Get('special')
  getSpecialLeaderboard(
    @Query('hackathonId') hackathonId?: string,
    @Query('round') round?: string
  ) {
    return this.service.getSpecialLeaderboard({
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

  @Get('certificates-released')
  async getCertificatesReleased() {
    const released = await this.service.getCertificatesReleasedFlag()
    this.gateway.syncCertificatesReleased(released)
    return { released }
  }

  @Post('certificates-released')
  async setCertificatesReleased(@Body() dto: TvModeDto) {
    const released = Boolean(dto.enabled)
    await this.service.setCertificatesReleasedFlag(released)
    await this.gateway.broadcastCertificatesReleased(released)
    return { success: true, released }
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

  @Post('reveal-step')
  async setRevealStep(@Body() dto: { step: number; round?: number }) {
    const step = Number(dto.step ?? 0)
    const round = dto.round ? Number(dto.round) : 3
    await this.gateway.broadcastRevealStep(step, round)
    return { success: true, step, round }
  }

  @Post('reveal-stop')
  async stopReveal() {
    await this.gateway.broadcastStopReveal()
    return { success: true, isRevealing: false }
  }

  @Get('special/reveal-state')
  getSpecialRevealState() {
    return this.gateway.getSpecialRevealState()
  }

  @Post('special/reveal-start')
  async startSpecialReveal(@Body() dto: { phase?: 'TOP5' | 'FINALE' }) {
    const phase = dto.phase === 'FINALE' ? 'FINALE' : 'TOP5'
    await this.gateway.broadcastSpecialRevealStart(phase)
    return { success: true, ...this.gateway.getSpecialRevealState() }
  }

  @Post('special/reveal-step')
  async setSpecialRevealStep(@Body() dto: { step: number; phase?: 'TOP5' | 'FINALE' }) {
    const step = Number(dto.step ?? 0)
    await this.gateway.broadcastSpecialRevealStep(step, dto.phase)
    return { success: true, ...this.gateway.getSpecialRevealState() }
  }

  @Post('special/reveal-stop')
  async stopSpecialReveal() {
    await this.gateway.broadcastSpecialRevealStop()
    return { success: true, ...this.gateway.getSpecialRevealState() }
  }

  @Post('admin-score')
  async updateAdminScore(@Body() dto: AdminScoreDto) {
    await this.service.updateAdminScore(dto.teamId, dto.score, dto.scoreRound)
    await this.gateway.broadcastLeaderboardUpdate()
    await this.gateway.broadcastSpecialLeaderboardUpdate()
    return { success: true }
  }
}
