import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { BadRequestException } from '@nestjs/common'
import { Server, Socket } from 'socket.io'
import { LeaderboardService } from './leaderboard.service'

@WebSocketGateway({
  cors: {
    origin: [process.env.FRONTEND_URL ?? 'http://localhost:3000', 'https://voiceathon.snapserve.ai'],
    credentials: true,
  },
  namespace: '/',
})
export class LeaderboardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private isTvMode = false
  private isRevealing = false
  private revealRound = 2
  private revealStep = 0
  private revealStepStartedAt = 0
  private revealNextAllowedAt = 0

  private getRevealStatePayload() {
    return {
      isRevealing: this.isRevealing,
      round: this.revealRound,
      step: this.revealStep,
      startedAt: this.revealStepStartedAt,
      nextAllowedAt: this.revealNextAllowedAt,
    }
  }

  constructor(private readonly leaderboardService: LeaderboardService) {}

  async handleConnection(client: Socket) {
    console.log(`[WS] Client connected: ${client.id}`)
    client.join('leaderboard')
    try {
      const leaderboard = await this.leaderboardService.getLeaderboard()
      client.emit('leaderboard:update', leaderboard)
      client.emit('leaderboard:tv_mode', { tvMode: this.isTvMode })
      client.emit('leaderboard:reveal_state', this.getRevealStatePayload())
    } catch (err) {
      console.error('[WS] Error sending initial state on connection:', err)
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`[WS] Client disconnected: ${client.id}`)
  }

  @SubscribeMessage('leaderboard:subscribe')
  async handleSubscribe(client: Socket) {
    const leaderboard = await this.leaderboardService.getLeaderboard()
    client.emit('leaderboard:update', leaderboard)
    client.emit('leaderboard:tv_mode', { tvMode: this.isTvMode })
    client.emit('leaderboard:reveal_state', this.getRevealStatePayload())
  }

  getTvMode(): boolean {
    return this.isTvMode
  }

  getRevealState() {
    return this.getRevealStatePayload()
  }

  // Called by ScoresService after score submission
  async broadcastLeaderboardUpdate() {
    try {
      if (!this.server) return
      const leaderboard = await this.leaderboardService.getLeaderboard()
      this.server.to('leaderboard').emit('leaderboard:update', leaderboard)
      console.log('[WS] Leaderboard broadcast sent')
    } catch (err) {
      console.error('[WS] Leaderboard broadcast failed:', err)
    }
  }

  // Called when Admin toggles TV Mode ON/OFF
  async broadcastTvMode(enabled: boolean) {
    this.isTvMode = enabled
    try {
      if (!this.server) return
      this.server.to('leaderboard').emit('leaderboard:tv_mode', { tvMode: enabled })
      console.log('[WS] TV Mode broadcast sent:', enabled)
    } catch (err) {
      console.error('[WS] TV Mode broadcast failed:', err)
    }
  }

  // Called when Admin triggers Stage Grand Reveal
  async broadcastRevealEvent(payload: { round: number; type: string; timestamp: number }) {
    this.isRevealing = true
    this.revealRound = payload.round || 2
    this.revealStep = 0
    this.revealStepStartedAt = payload.timestamp || Date.now()
    this.revealNextAllowedAt = this.revealStepStartedAt
    try {
      if (!this.server) return
      this.server.to('leaderboard').emit('leaderboard:reveal_start', payload)
      this.server.to('leaderboard').emit('leaderboard:reveal_state', this.getRevealStatePayload())
      console.log('[WS] Reveal broadcast sent:', payload)
    } catch (err) {
      console.error('[WS] Reveal broadcast failed:', err)
    }
  }

  // Called when Admin triggers a finale step (1 = 5th … 5 = Grand Champion)
  async broadcastRevealStep(step: number, round: number = 3) {
    const normalizedRound = round || 3
    const now = Date.now()
    // Step 4 includes the 2nd-place reveal, verdict interruption, and a
    // five-second Final Two hold before the Champion control unlocks.
    const finaleDurations = [0, 14000, 15000, 16000, 28000, 12000]

    if (normalizedRound === 3) {
      if (step === this.revealStep && this.revealRound === 3) return
      if (step !== 0 && step !== this.revealStep + 1) {
        throw new BadRequestException(`Reveal step ${this.revealStep + 1} must run next.`)
      }
      if (step !== 0 && now < this.revealNextAllowedAt) {
        const seconds = Math.ceil((this.revealNextAllowedAt - now) / 1000)
        throw new BadRequestException(`Current finale animation is still running. Wait ${seconds} second${seconds === 1 ? '' : 's'}.`)
      }
    }

    this.isRevealing = true
    this.revealRound = normalizedRound
    this.revealStep = step
    this.revealStepStartedAt = now
    this.revealNextAllowedAt = normalizedRound === 3
      ? now + (finaleDurations[step] || 0)
      : now
    try {
      if (!this.server) return
      this.server.to('leaderboard').emit('leaderboard:reveal_step', {
        step,
        round: this.revealRound,
        startedAt: this.revealStepStartedAt,
        nextAllowedAt: this.revealNextAllowedAt,
      })
      this.server.to('leaderboard').emit('leaderboard:reveal_state', this.getRevealStatePayload())
      console.log(`[WS] Reveal Step ${step} (Round ${this.revealRound}) broadcast sent`)
    } catch (err) {
      console.error('[WS] Reveal step broadcast failed:', err)
    }
  }

  // Called when Admin stops / closes reveal mode
  async broadcastStopReveal() {
    this.isRevealing = false
    try {
      if (!this.server) return
      this.server.to('leaderboard').emit('leaderboard:reveal_stop', { isRevealing: false, round: this.revealRound, step: this.revealStep })
      this.server.to('leaderboard').emit('leaderboard:reveal_state', { isRevealing: false, round: this.revealRound, step: this.revealStep })
      console.log('[WS] Stop reveal broadcast sent')
    } catch (err) {
      console.error('[WS] Stop reveal broadcast failed:', err)
    }
  }

  // Promotion must never leave a ceremony running. Only broadcast a stop
  // when a ceremony is actually live — otherwise the public LCD treats the
  // default revealRound (2) as a command to switch into the Top 20 board.
  async clearRevealOnPromote() {
    const wasRevealing = this.isRevealing
    this.isRevealing = false
    this.revealStep = 0
    this.revealStepStartedAt = 0
    this.revealNextAllowedAt = 0
    if (!wasRevealing) return
    try {
      if (!this.server) return
      this.server.to('leaderboard').emit('leaderboard:reveal_stop', {
        isRevealing: false,
        round: this.revealRound,
        step: 0,
      })
      this.server.to('leaderboard').emit('leaderboard:reveal_state', {
        isRevealing: false,
        round: this.revealRound,
        step: 0,
      })
    } catch (err) {
      console.error('[WS] Clear reveal on promote failed:', err)
    }
  }

  // After Top 5 promotion, move every public display to the sealed Grand
  // Finale ready screen. Step 0 keeps all finalist names and scores hidden.
  async showFinaleReady() {
    this.isRevealing = true
    this.revealStep = 0
    this.revealRound = 3
    this.revealStepStartedAt = Date.now()
    this.revealNextAllowedAt = this.revealStepStartedAt
    try {
      if (!this.server) return
      const payload = {
        round: 3,
        type: 'GRAND_FINALE_READY',
        timestamp: this.revealStepStartedAt,
      }
      this.server.to('leaderboard').emit('leaderboard:reveal_start', payload)
      this.server.to('leaderboard').emit('leaderboard:reveal_state', this.getRevealStatePayload())
    } catch (err) {
      console.error('[WS] Show Grand Finale ready screen failed:', err)
    }
  }
}
