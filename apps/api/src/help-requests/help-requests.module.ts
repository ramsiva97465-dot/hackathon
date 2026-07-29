import { Module } from '@nestjs/common';
import { HelpRequestsController } from './help-requests.controller';
import { HelpRequestsService } from './help-requests.service';

@Module({
  controllers: [HelpRequestsController],
  providers: [HelpRequestsService],
  exports: [HelpRequestsService],
})
export class HelpRequestsModule {}
