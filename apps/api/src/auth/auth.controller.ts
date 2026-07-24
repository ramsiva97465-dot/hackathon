import { All, Controller, Req, Res } from '@nestjs/common'
import { Request, Response } from 'express'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './better-auth'

const nodeHandler = toNodeHandler(auth)

@Controller('auth')
export class AuthController {
  @All('*')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    return nodeHandler(req, res)
  }
}
