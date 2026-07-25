import { Module } from '@nestjs/common'
import { ScoresController } from './scores.controller'
import { ScoresService } from './scores.service'
import { PrismaModule } from '../prisma/prisma.module'
import { LeaderboardModule } from '../leaderboard/leaderboard.module'

@Module({
  imports: [PrismaModule, LeaderboardModule],
  controllers: [ScoresController],
  providers: [ScoresService],
})
export class ScoresModule {}
