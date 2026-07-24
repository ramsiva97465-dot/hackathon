import { Controller, Get, Query } from '@nestjs/common'
import { LeaderboardService } from './leaderboard.service'

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly service: LeaderboardService) {}

  @Get()
  getLeaderboard(@Query('hackathonId') hackathonId?: string) {
    return this.service.getLeaderboard(hackathonId ? { hackathonId } : undefined)
  }
}
