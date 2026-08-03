import { Controller, Get, Post, Body, Param, Patch, UseGuards, Req } from '@nestjs/common'
import { TeamsService } from './teams.service'
import { ParticipantGuard } from '../auth/participant.guard'
import { AuthGuard, PermissionsGuard, RequirePermissions } from '../auth/guards'

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
      agentName?: string
      agentSolution?: string
      githubUrl?: string
      demoUrl?: string
      techStack?: string[]
      followedInstagram?: boolean
      followedLinkedin?: boolean
      members?: { id?: string; name: string; email: string; role?: string; linkedin?: string; github?: string }[]
    }
  ) {
    const teamId = req.participant.teamId
    return this.service.submitProject(teamId, body)
  }

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Post('nuke-dummy-data-now')
  async nukeDummyData() {
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    // Delete Judges (except the main test judge)
    const dummyJudges = await prisma.user.findMany({
      where: { role: 'JUDGE', email: { not: 'judge@theaitel.com' } }
    })
    for (const dj of dummyJudges) {
      await prisma.judge.deleteMany({ where: { id: dj.id } })
      await prisma.user.delete({ where: { id: dj.id } })
    }

    // Wipe all team and score related data
    await prisma.leaderboard.deleteMany({})
    await prisma.teamMember.deleteMany({})
    await prisma.score.deleteMany({})
    await prisma.scoreSheet.deleteMany({})
    await prisma.judgeAssignment.deleteMany({})
    await prisma.team.deleteMany({})
    await prisma.application.deleteMany({})
    
    return { success: true, message: 'Nuked all dummy data successfully (including judges & leaderboard)!' }
  }

  @Post('validate-url')
  validateUrl(@Body('url') url: string) {
    return this.service.validateUrl(url)
  }

  @Post(':id/assign-judge')
  assignJudge(
    @Param('id') id: string,
    @Body('judgeId') judgeId: string
  ) {
    return this.service.assignJudge(id, judgeId)
  }

  @Post('auto-distribute-judges')
  autoDistributeJudges(@Body('judgesPerTeam') judgesPerTeam?: number) {
    return this.service.autoDistributeJudges(judgesPerTeam ?? 1)
  }

  @Patch(':id/table-number')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('SETTINGS_MANAGE')
  updateTableNumber(@Param('id') id: string, @Body('tableNumber') tableNumber: string) {
    return this.service.updateTableNumber(id, tableNumber)
  }

  @Patch(':id/bonus')
  updateBonus(@Param('id') id: string, @Body('bonusPoints') bonusPoints: number) {
    return this.service.updateBonus(id, bonusPoints)
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
