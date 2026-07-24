import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApplicationsService } from './applications.service'
import { CreateApplicationDto } from './dto/create-application.dto'

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly service: ApplicationsService) {}

  @Post()
  create(@Body() dto: CreateApplicationDto) {
    return this.service.create(dto)
  }

  @Get()
  findAll(@Query() query: { status?: string; track?: string; page?: number; limit?: number }) {
    return this.service.findAll(query)
  }

  @Get('stats')
  getStats() {
    return this.service.getStats()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.service.approve(id)
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.service.reject(id, body.reason)
  }

  @Patch(':id/request-changes')
  requestChanges(@Param('id') id: string, @Body() body: { message: string }) {
    return this.service.requestChanges(id, body.message)
  }
}
