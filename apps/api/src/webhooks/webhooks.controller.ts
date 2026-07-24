import { Controller, Post, Body, Headers, RawBodyRequest, Req, ForbiddenException } from '@nestjs/common'
import { Request } from 'express'
import { ConfigService } from '@nestjs/config'
import { ApplicationsService } from '../applications/applications.service'
import * as crypto from 'crypto'

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly config: ConfigService,
    private readonly applications: ApplicationsService,
  ) {}

  @Post('luma')
  async handleLumaWebhook(
    @Headers('x-luma-signature') signature: string,
    @Body() body: any,
    @Req() req: RawBodyRequest<Request>,
  ) {
    // Verify Luma webhook signature
    const secret = this.config.get('LUMA_WEBHOOK_SECRET')
    if (secret) {
      const rawBody = JSON.stringify(body)
      const expectedSig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
      if (signature !== `sha256=${expectedSig}`) {
        throw new ForbiddenException('Invalid webhook signature')
      }
    }

    // Handle event types
    const { event, data } = body
    console.log(`[Luma Webhook] Event: ${event}`)

    if (event === 'registrant.created' || event === 'event.registration.created') {
      const registrant = data?.registrant ?? data
      await this.applications.createFromWebhook({
        teamName: registrant.name ?? 'Unnamed Team',
        college: registrant.userData?.college ?? 'Unknown College',
        email: registrant.email,
        name: registrant.name,
        lumaEventId: data.event_api_id ?? '',
        lumaRegistrationId: registrant.api_id ?? '',
        hackathonId: this.config.get('HACKATHON_ID') ?? 'default',
      })
    }

    return { received: true }
  }
}
