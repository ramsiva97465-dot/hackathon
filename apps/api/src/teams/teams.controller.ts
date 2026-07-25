import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common'
import { TeamsService } from './teams.service'

@Controller('teams')
export class TeamsController {
  constructor(private readonly service: TeamsService) {}

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
}
