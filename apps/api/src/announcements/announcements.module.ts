import { Module } from '@nestjs/common'
import { AnnouncementsController } from './announcements.controller'
import { AnnouncementsService } from './announcements.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService],
})
export class AnnouncementsModule {}
