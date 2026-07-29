import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HelpRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(teamId: string, issueType: string, description?: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { hackathon: true }
    });
    if (!team) throw new NotFoundException('Team not found');

    const helpRequest = await (this.prisma as any).helpRequest.create({
      data: {
        teamId,
        hackathonId: team.hackathonId,
        issueType,
        description,
      }
    });

    return { success: true, data: helpRequest };
  }

  async getActive() {
    const requests = await (this.prisma as any).helpRequest.findMany({
      where: {
        status: { not: 'RESOLVED' }
      },
      include: {
        team: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: requests };
  }

  async resolve(id: string) {
    const request = await (this.prisma as any).helpRequest.update({
      where: { id },
      data: { status: 'RESOLVED' }
    });
    return { success: true, data: request };
  }
}
