import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { EmailsService } from '../emails/emails.service'
import { CreateApplicationDto } from './dto/create-application.dto'

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emails: EmailsService,
  ) {}

  async create(dto: CreateApplicationDto) {
    if (dto.type === 'TEAM') {
      if (!dto.members || dto.members.length < 2 || dto.members.length > 3) {
        throw new BadRequestException('A team must have between 2 and 3 members.')
      }
    }
    let hackathon = await this.prisma.hackathon.findFirst()
    if (!hackathon) {
      hackathon = await this.prisma.hackathon.create({
        data: {
          id: 'default',
          name: 'AI Voice Agent Hackathon 2026',
          slug: 'ai-voice-agent-2026',
          startDate: new Date('2026-08-15T09:00:00Z'),
          endDate: new Date('2026-08-17T18:00:00Z'),
          registrationStartDate: new Date('2026-07-01T00:00:00Z'),
          registrationEndDate: new Date('2026-08-10T23:59:59Z'),
        }
      })
    }

    let track = await this.prisma.track.findFirst({
      where: { hackathonId: hackathon.id },
    })

    if (!track) {
      track = await this.prisma.track.create({
        data: {
          hackathonId: hackathon.id,
          name: 'Voice AI',
          slug: 'voice-ai',
          description: 'Emotion detection, voice cloning, and audio synthesis.',
        },
      })
    }

    const leader = dto.members[0]
    const finalTeamName = dto.type === 'INDIVIDUAL' ? leader.name : (dto.teamName || `${leader.name}'s Team`)

    const application = await this.prisma.application.create({
      data: {
        hackathonId: hackathon.id,
        trackId: track.id,
        teamName: finalTeamName,
        type: dto.type,
        college: null,
        company: null,
        teamLeaderName: leader.name,
        teamLeaderEmail: leader.email,
        teamSize: dto.members.length,
        projectTitle: dto.projectTitle || 'AI Voice Project',
        projectDescription: dto.projectDescription || 'No pitch provided',
        experience: null,
        techStack: dto.techStack || [],
        status: 'PENDING',
        teamMembers: {
          create: dto.members.map((m, idx) => ({
            name: m.name,
            email: m.email,
            phone: m.phone || null,
            linkedin: m.linkedin || null,
            github: m.github || null,
            role: idx === 0 ? 'Team Lead' : (m.role || 'Member'),
          }))
        }
      },
      include: {
        teamMembers: true
      }
    })

    try {
      await this.emails.sendRegistrationEmail([leader.email], finalTeamName)
    } catch (err) {
      console.error('Failed to send registration confirmation email:', err)
    }

    return {
      success: true,
      data: application
    }
  }

  async findAll(query: { status?: string; track?: string; page?: number; limit?: number }) {
    const { status, track, page = 1, limit = 20 } = query
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status

    const [items, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        include: { teamMembers: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.application.count({ where }),
    ])

    return {
      success: true,
      data: {
        items,
        total,
        page: Number(page),
        limit: Number(limit),
        hasNext: skip + items.length < total,
        hasPrev: page > 1,
      },
    }
  }

  async getStats() {
    const [total, pending, approved, rejected, underReview] = await Promise.all([
      this.prisma.application.count(),
      this.prisma.application.count({ where: { status: 'PENDING' } }),
      this.prisma.application.count({ where: { status: 'APPROVED' } }),
      this.prisma.application.count({ where: { status: 'REJECTED' } }),
      this.prisma.application.count({ where: { status: 'UNDER_REVIEW' } }),
    ])

    return { success: true, data: { total, pending, approved, rejected, underReview } }
  }

  async findOne(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: { teamMembers: true },
    })
    if (!application) throw new NotFoundException('Application not found')
    return { success: true, data: application }
  }

  async approve(id: string) {
    const application = await this.prisma.application.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvalTimestamp: new Date(),
      },
      include: { teamMembers: true },
    })

    // Search or create track
    let track = await this.prisma.track.findFirst({
      where: { hackathonId: application.hackathonId },
    })

    if (!track) {
      track = await this.prisma.track.create({
        data: {
          hackathonId: application.hackathonId,
          name: 'Voice AI',
          slug: 'voice-ai',
        },
      })
    }

    // Create team record
    await this.prisma.team.create({
      data: {
        hackathonId: application.hackathonId,
        applicationId: id,
        name: application.teamName,
        trackId: track.id,
        status: 'COMPETING',
      },
    })

    // Send approval email
    const toEmails = application.teamMembers.map(m => m.email)
    await this.emails.sendApprovalEmail(toEmails, application.teamName)

    return { success: true, data: application }
  }

  async reject(id: string, reason: string) {
    const application = await this.prisma.application.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
      include: { teamMembers: true },
    })

    // Send rejection email
    const toEmails = application.teamMembers.map(m => m.email)
    await this.emails.sendRejectionEmail(toEmails, application.teamName, reason)

    return { success: true, data: application }
  }

  async requestChanges(id: string, message: string) {
    const application = await this.prisma.application.update({
      where: { id },
      data: { status: 'UNDER_REVIEW' },
    })
    return { success: true, data: application }
  }

  // Called by Luma webhook
  async createFromWebhook(data: {
    teamName: string
    college: string
    email: string
    name: string
    lumaEventId: string
    lumaRegistrationId: string
    hackathonId: string
  }) {
    // Search or create track
    let track = await this.prisma.track.findFirst({
      where: { hackathonId: data.hackathonId },
    })

    if (!track) {
      track = await this.prisma.track.create({
        data: {
          hackathonId: data.hackathonId,
          name: 'Voice AI',
          slug: 'voice-ai',
        },
      })
    }

    const application = await this.prisma.application.create({
      data: {
        hackathon: { connect: { id: data.hackathonId } },
        teamName: data.teamName,
        college: data.college,
        teamLeaderName: data.name,
        teamLeaderEmail: data.email,
        track: { connect: { id: track.id } },
        status: 'PENDING',
        lumaEventId: data.lumaEventId,
        lumaRegistrationId: data.lumaRegistrationId,
        teamMembers: {
          create: {
            name: data.name,
            email: data.email,
            role: 'Team Lead',
          },
        },
      },
      include: {
        teamMembers: true,
      },
    })

    // Send confirmation email
    await this.emails.sendRegistrationEmail([data.email], data.teamName)

    return application
  }
}
