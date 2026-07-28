import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import * as jwt from 'jsonwebtoken'

@Injectable()
export class ParticipantGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid participant token')
    }

    const token = authHeader.split(' ')[1]
    try {
      const secret = process.env.BETTER_AUTH_SECRET || 'fallback-secret-for-jwt-signing'
      const decoded = jwt.verify(token, secret) as any
      if (!decoded.memberId || !decoded.teamId) {
        throw new UnauthorizedException('Invalid participant session data')
      }
      request.participant = decoded
      return true
    } catch (err) {
      throw new UnauthorizedException('Participant session is expired or invalid')
    }
  }
}
