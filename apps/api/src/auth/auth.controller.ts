import { All, Controller, Req, Res, Post, Body } from '@nestjs/common'
import { Request, Response } from 'express'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './better-auth'
import { AuthService } from './auth.service'

const nodeHandler = toNodeHandler(auth)

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('participant-login')
  async participantLogin(@Body('email') email: string) {
    return this.authService.participantLogin(email)
  }

  @All('*')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    return nodeHandler(req, res)
  }
}
