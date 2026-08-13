import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common'
import { AttendanceService } from './attendance.service'

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Get('lookup')
  lookup(@Query('q') q: string) {
    return this.service.lookup(q)
  }

  @Post('check-in')
  markMemberAttendance(
    @Body() body: { memberId: string; isPresent: boolean },
    @Req() req: any
  ) {
    const adminUserId = req?.user?.id || 'ADMIN'
    return this.service.markMemberAttendance(body.memberId, body.isPresent, adminUserId)
  }

  @Post('verify-bonus')
  verifyTeamBonus(
    @Body() body: { teamId: string; bonusPoints: number },
    @Req() req: any
  ) {
    const adminUserId = req?.user?.id || 'ADMIN'
    return this.service.verifyTeamBonus(body.teamId, body.bonusPoints, adminUserId)
  }
}
