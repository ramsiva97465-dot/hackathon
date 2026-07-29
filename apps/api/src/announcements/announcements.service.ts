import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  async getActive() {
    return this.prisma.announcement.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getAll() {
    return this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(message: string, title: string = 'New Announcement', hackathonId?: string) {
    // If no hackathonId is provided, try to fetch the default one
    if (!hackathonId) {
      const hackathon = await this.prisma.hackathon.findFirst();
      hackathonId = hackathon?.id;
    }
    
    if (!hackathonId) {
      throw new Error("No hackathon found");
    }

    return this.prisma.announcement.create({
      data: { message, title, hackathonId },
    })
  }

  async toggleActive(id: string, isPublished: boolean) {
    return this.prisma.announcement.update({
      where: { id },
      data: { isPublished },
    })
  }

  async delete(id: string) {
    return this.prisma.announcement.delete({
      where: { id }
    })
  }
}
