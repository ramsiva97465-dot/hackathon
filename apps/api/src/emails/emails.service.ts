import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'

// Brevo API implementation
let brevoApiKey: string | null = null

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name)
  private readonly fromEmail: string
  private readonly fromName: string

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.fromEmail = config.get('EMAIL_FROM') ?? 'hackathon@theaitel.com'
    this.fromName = config.get('HACKATHON_NAME') ?? 'AI Voice Hackathon'
    this.initBrevo()
  }

  private initBrevo() {
    const apiKey = this.config.get('BREVO_API_KEY')
    if (apiKey) {
      brevoApiKey = apiKey
      this.logger.log('Brevo email service initialized')
    } else {
      this.logger.warn('Brevo API key not found, emails will be logged only')
    }
  }

  async sendEmail(params: {
    to: string[]
    subject: string
    html: string
    template: string
  }) {
    const logEntry = await this.prisma.auditLog.create({
      data: {
        action: 'EMAIL_SENT',
        entityType: 'EMAIL',
        entityId: params.to.join(','),
        newValue: { subject: params.subject, template: params.template, status: 'QUEUED' },
      },
    })

    try {
      if (brevoApiKey) {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': brevoApiKey,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: this.fromName, email: this.fromEmail },
            to: params.to.map(email => ({ email })),
            subject: params.subject,
            htmlContent: params.html
          })
        })

        if (!response.ok) {
          const errorData = await response.text()
          throw new Error(`Brevo API error: ${response.status} - ${errorData}`)
        }
      } else {
        this.logger.log(`[EMAIL MOCK] To: ${params.to.join(', ')} | Subject: ${params.subject}`)
      }

      await this.prisma.auditLog.update({
        where: { id: logEntry.id },
        data: {
          newValue: { subject: params.subject, template: params.template, status: 'SENT', sentAt: new Date() }
        },
      })
    } catch (err) {
      this.logger.error('Failed to send email', err)
      await this.prisma.auditLog.update({
        where: { id: logEntry.id },
        data: {
          newValue: { subject: params.subject, template: params.template, status: 'FAILED' }
        },
      })
    }
  }

  async sendRegistrationEmail(to: string[], teamName: string) {
    await this.sendEmail({
      to,
      subject: `✅ Registration Received — AI Voice Hackathon 2026`,
      template: 'REGISTRATION_RECEIVED',
      html: this.registrationTemplate(teamName),
    })
  }

  async sendApprovalEmail(to: string[], teamName: string) {
    await this.sendEmail({
      to,
      subject: `🎉 Congratulations! ${teamName} is Approved — AI Voice Hackathon`,
      template: 'APPLICATION_APPROVED',
      html: this.approvalTemplate(teamName),
    })
  }

  async sendRejectionEmail(to: string[], teamName: string, reason: string) {
    await this.sendEmail({
      to,
      subject: `Application Update — AI Voice Hackathon 2026`,
      template: 'APPLICATION_REJECTED',
      html: this.rejectionTemplate(teamName, reason),
    })
  }

  private registrationTemplate(teamName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="background:#050816;color:#fff;font-family:Inter,sans-serif;padding:40px;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#4F46E5,#06B6D4);padding:2px;border-radius:16px;">
          <div style="background:#0F172A;border-radius:14px;padding:40px;">
            <h1 style="font-size:28px;margin:0 0 8px;">🎤 Registration Received</h1>
            <p style="color:#94A3B8;margin:0 0 32px;">AI Voice Agent Hackathon 2026</p>
            <p>Hi <strong>${teamName}</strong>,</p>
            <p style="color:#94A3B8;line-height:1.6;">
              We've received your registration for the AI Voice Agent Hackathon 2026. Our team will review your application and get back to you within 48 hours.
            </p>
            <div style="background:rgba(79,70,229,0.1);border:1px solid rgba(79,70,229,0.2);border-radius:12px;padding:20px;margin:24px 0;">
              <strong>What's next?</strong>
              <ul style="color:#94A3B8;margin:8px 0 0;padding-left:20px;">
                <li>Wait for your approval email</li>
                <li>Check the schedule on our website</li>
                <li>Join our Discord community</li>
              </ul>
            </div>
            <p style="color:#94A3B8;font-size:14px;">— The Aitel Team</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private approvalTemplate(teamName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="background:#050816;color:#fff;font-family:Inter,sans-serif;padding:40px;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#22C55E,#06B6D4);padding:2px;border-radius:16px;">
          <div style="background:#0F172A;border-radius:14px;padding:40px;">
            <h1 style="font-size:28px;margin:0 0 8px;">🎉 You're In!</h1>
            <p style="color:#94A3B8;margin:0 0 32px;">AI Voice Agent Hackathon 2026</p>
            <p>Congratulations, <strong>${teamName}</strong>!</p>
            <p style="color:#94A3B8;line-height:1.6;">
              Your application has been <strong style="color:#22C55E">approved</strong>. Get ready to build the future of Voice AI!
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="https://hackathon.theaitel.com" style="background:linear-gradient(135deg,#4F46E5,#06B6D4);color:#fff;text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:600;display:inline-block;">
                View Hackathon Details →
              </a>
            </div>
            <p style="color:#94A3B8;font-size:14px;">— The Aitel Team</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private rejectionTemplate(teamName: string, reason: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="background:#050816;color:#fff;font-family:Inter,sans-serif;padding:40px;max-width:600px;margin:0 auto;">
        <div style="background:rgba(255,255,255,0.1);padding:2px;border-radius:16px;">
          <div style="background:#0F172A;border-radius:14px;padding:40px;">
            <h1 style="font-size:24px;margin:0 0 32px;">Application Update</h1>
            <p>Hi <strong>${teamName}</strong>,</p>
            <p style="color:#94A3B8;line-height:1.6;">
              After reviewing your application, we're unable to accept it at this time.
            </p>
            <div style="background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.15);border-radius:12px;padding:20px;margin:24px 0;">
              <strong style="color:#EF4444">Reason:</strong>
              <p style="color:#94A3B8;margin:8px 0 0;">${reason}</p>
            </div>
            <p style="color:#94A3B8;line-height:1.6;">We encourage you to apply for our future events. Thank you for your interest!</p>
            <p style="color:#94A3B8;font-size:14px;">— The Aitel Team</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}
