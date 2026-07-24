import { Module } from '@nestjs/common'
import { WebhooksController } from './webhooks.controller'
import { ApplicationsModule } from '../applications/applications.module'

@Module({
  imports: [ApplicationsModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
