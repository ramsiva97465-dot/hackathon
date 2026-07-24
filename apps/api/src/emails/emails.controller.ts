import { Controller, Get, Post, Body } from '@nestjs/common'
import { EmailsService } from './emails.service'

@Controller('emails')
export class EmailsController {
  constructor(private readonly service: EmailsService) {}

  @Post('send')
  send(@Body() body: { to: string[]; subject: string; html: string; template: string }) {
    return this.service.sendEmail(body)
  }

  @Get('logs')
  logs() {
    return { success: true, message: 'Email logs endpoint' }
  }
}
