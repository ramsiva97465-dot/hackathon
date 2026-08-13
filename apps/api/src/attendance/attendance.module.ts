import { Module } from '@nestjs/common'
import { AttendanceController } from './attendance.controller'
import { AttendanceService } from './attendance.service'
import { LeaderboardModule } from '../leaderboard/leaderboard.module'

@Module({
  imports: [LeaderboardModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService]
})
export class AttendanceModule {}
