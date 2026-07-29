import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common'
import { AnnouncementsService } from './announcements.service'

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  @Get()
  getActive() {
    return this.service.getActive()
  }

  @Get('all')
  getAll() {
    return this.service.getAll()
  }

  @Post()
  create(@Body('message') message: string) {
    return this.service.create(message)
  }

  @Patch(':id/toggle')
  toggleActive(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.service.toggleActive(id, isActive)
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id)
  }
}
