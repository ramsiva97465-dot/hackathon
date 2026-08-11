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
      const allMembers = await this.prisma.teamMember.findMany({
        where: { email: { equals: trimmedEmail, mode: 'insensitive' } },
        include: { team: { include: { track: true, members: true } } }
      })

      if (!allMembers || allMembers.length === 0) {
        throw new UnauthorizedException('Email is not registered in any team.')
      }

      // Sort so multi-member teams take priority over old abandoned 1-member teams
      allMembers.sort((a, b) => {
        const countA = a.team?.members?.length || 0
        const countB = b.team?.members?.length || 0
        return countB - countA
      })

      const member = allMembers[0]

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

