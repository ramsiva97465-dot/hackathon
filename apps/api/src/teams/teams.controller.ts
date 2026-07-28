import { Controller, Get, Post, Body, Param, Patch, UseGuards, Req } from '@nestjs/common'
import { TeamsService } from './teams.service'
import { ParticipantGuard } from '../auth/participant.guard'

@Controller('teams')
export class TeamsController {
  constructor(private readonly service: TeamsService) {}

  @Get('my-team')
  @UseGuards(ParticipantGuard)
  findMyTeam(@Req() req: any) {
    const teamId = req.participant.teamId
    return this.service.findMyTeam(teamId)
  }

  @Post('submit-project')
  @UseGuards(ParticipantGuard)
  submitProject(
    @Req() req: any,
    @Body() body: {
      projectTitle?: string
      projectDescription?: string
      githubUrl?: string
      demoUrl?: string
      techStack?: string[]
    }
  ) {
    const teamId = req.participant.teamId
    return this.service.submitProject(teamId, body)
  }

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Post(':id/assign-judge')
  assignJudge(
    @Param('id') id: string,
    @Body('judgeId') judgeId: string
  ) {
    return this.service.assignJudge(id, judgeId)
  }

  @Patch(':id/table-number')
  updateTableNumber(
    @Param('id') id: string,
    @Body('tableNumber') tableNumber: string
  ) {
    return this.service.updateTableNumber(id, tableNumber)
  }

  @Post('promote')
  promoteTeams(@Body('currentRound') currentRound: number) {
    return this.service.promoteTeams(Number(currentRound))
  }

  @Post('reset-rounds')
  resetRounds() {
    return this.service.resetRounds()
  }

  @Post('import')
  importTeams(@Body('teams') teams: any[]) {
    return this.service.importTeams(teams)
  }
}
