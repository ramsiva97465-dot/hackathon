import { Controller, Get, Post, Body, Param, Patch, UseGuards, Req, Delete } from '@nestjs/common'
import { TeamsService } from './teams.service'
import { ParticipantGuard } from '../auth/participant.guard'
import { AuthGuard, PermissionsGuard, RequirePermissions } from '../auth/guards'
import { Type } from 'class-transformer'
import { IsNumber, IsOptional } from 'class-validator'

class PromoteTeamsDto {
  @Type(() => Number)
  @IsNumber()
  currentRound: number
}

class AutoDistributeJudgesDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  judgesPerTeam?: number

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  round?: number
}

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
      teamName?: string
      projectTitle?: string
      projectDescription?: string
      agentName?: string
      agentSolution?: string
      agentPhoneNumber?: string
      agentArchitecture?: string
      squadAgents?: { name: string; phone?: string; role?: string }[]
      githubUrl?: string
      demoUrl?: string
      techStack?: string[]
      followedInstagram?: boolean
      followedLinkedin?: boolean
      members?: { id?: string; name: string; email: string; phone?: string; role?: string; linkedin?: string; github?: string }[]
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
    
    for (const j of dummyJudges) {
      await prisma.judgeAssignment.deleteMany({ where: { judgeId: j.id } })
      await prisma.scoreSheet.deleteMany({ where: { judgeId: j.id } })
      await prisma.judge.deleteMany({ where: { userId: j.id } })
      await prisma.session.deleteMany({ where: { userId: j.id } })
      await prisma.user.delete({ where: { id: j.id } })
    }

    // Delete Dummy Teams & Scores
    await prisma.leaderboard.deleteMany({})
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
  autoDistributeJudges(@Body() dto: AutoDistributeJudgesDto) {
    return this.service.autoDistributeJudges(dto?.judgesPerTeam ?? 1, dto?.round ? Number(dto.round) : undefined)
  }

  @Patch(':id/table-number')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('SETTINGS_MANAGE')
  updateTableNumber(@Param('id') id: string, @Body('tableNumber') tableNumber: string) {
    return this.service.updateTableNumber(id, tableNumber)
  }

  @Patch(':id/name')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('SETTINGS_MANAGE')
  updateTeamName(@Param('id') id: string, @Body('name') name: string) {
    return this.service.updateTeamName(id, name)
  }

  @Patch(':id/bonus')
  updateBonus(@Param('id') id: string, @Body('bonusPoints') bonusPoints: number) {
    return this.service.updateBonus(id, bonusPoints)
  }

  @Post('promote')
  promoteTeams(@Body() dto: PromoteTeamsDto) {
    return this.service.promoteTeams(Number(dto.currentRound))
  }

  @Post('special/promote')
  promoteSpecialCategory() {
    return this.service.promoteSpecialCategory()
  }

  @Post('special/auto-distribute-judges')
  autoDistributeSpecialJudges(@Body() dto: AutoDistributeJudgesDto) {
    return this.service.autoDistributeSpecialJudges(dto?.round ? Number(dto.round) : 1)
  }

  @Post('undo-finalists')
  undoFinalists() {
    return this.service.undoFinalistPromotion()
  }

  @Post('reset-rounds')
  resetRounds() {
    return this.service.resetRounds()
  }

  @Post('import')
  importTeams(@Body('teams') teamsPayload: any[], @Body() body: any) {
    const teams = Array.isArray(teamsPayload) ? teamsPayload : (Array.isArray(body) ? body : (body?.teams || []))
    return this.service.importTeams(teams)
  }

  @Delete(':id')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('SETTINGS_MANAGE')
  removeTeam(@Param('id') id: string) {
    return this.service.removeTeam(id)
  }
}
