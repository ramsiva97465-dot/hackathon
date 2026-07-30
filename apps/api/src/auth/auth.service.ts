import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import * as jwt from 'jsonwebtoken'

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async participantLogin(email: string) {
    if (!email || typeof email !== 'string') {
      throw new UnauthorizedException('Email is required.')
    }

    try {
      const trimmedEmail = email.trim()
      const member = await this.prisma.teamMember.findFirst({
        where: { email: { equals: trimmedEmail, mode: 'insensitive' } },
        include: { team: { include: { track: true } } }
      })

      if (!member || !member.team) {
        throw new UnauthorizedException('Email is not registered in any team.')
      }

      const secret = process.env.BETTER_AUTH_SECRET || 'fallback-secret-for-jwt-signing'
      const token = jwt.sign(
        {
          memberId: member.id,
          teamId: member.team.id,
          name: member.name,
          email: member.email,
          role: member.role || 'Member'
        },
        secret,
        { expiresIn: '7d' }
      )

      return {
        success: true,
        token,
        member: {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role
        },
        team: {
          id: member.team.id,
          name: member.team.name,
          tableNumber: member.team.tableNumber,
          track: member.team.track?.name || 'General'
        }
      }
    } catch (err: any) {
      if (err instanceof UnauthorizedException) {
        throw err
      }
      console.error('Participant login error:', err)
      throw new UnauthorizedException('Email is not registered in any team.')
    }
  }
}

