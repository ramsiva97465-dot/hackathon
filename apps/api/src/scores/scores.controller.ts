import { Controller, Post, Body } from '@nestjs/common'
import { IsString, IsNumber, IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { ScoresService } from './scores.service'

class ScoreEntryDto {
  @IsString()
  criteriaId: string

  @IsNumber()
  score: number
}

class SubmitScoreDto {
  @IsString()
  judgeId: string

  @IsString()
  teamId: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScoreEntryDto)
  scores: ScoreEntryDto[]
}

@Controller('scores')
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Post()
  async submitScore(@Body() dto: SubmitScoreDto) {
    return this.scoresService.submitScore(dto.judgeId, dto.teamId, dto.scores)
  }
}
