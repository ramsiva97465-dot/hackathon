import { Module } from '@nestjs/common'
import { EmailsService } from './emails.service'
import { EmailsController } from './emails.controller'

@Module({
  controllers: [EmailsController],
  providers: [EmailsService],
  exports: [EmailsService],
})
export class EmailsModule {}
