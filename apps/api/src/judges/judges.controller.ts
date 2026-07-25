import { Controller, Get, Param, Post, Body, Delete } from '@nestjs/common'
import { JudgesService } from './judges.service'
import { IsString, IsEmail, IsOptional } from 'class-validator'

class CreateJudgeDto {
  @IsString()
  name: string

  @IsEmail()
  email: string

  @IsOptional()
  @IsString()
  password?: string

  @IsOptional()
  @IsString()
  company?: string

  @IsOptional()
  @IsString()
  designation?: string
}

@Controller('judges')
export class JudgesController {
  constructor(private readonly service: JudgesService) {}

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Post()
  create(@Body() data: CreateJudgeDto) {
    return this.service.createJudge(data)
  }

  @Get(':id/teams')
  getAssignedTeams(@Param('id') id: string) {
    return this.service.getAssignedTeams(id)
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.deleteJudge(id)
  }
}
