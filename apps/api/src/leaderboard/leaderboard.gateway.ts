import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
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

  constructor(private readonly leaderboardService: LeaderboardService) {}

  async handleConnection(client: Socket) {
    console.log(`[WS] Client connected: ${client.id}`)
    client.join('leaderboard')
    try {
      const leaderboard = await this.leaderboardService.getLeaderboard()
      client.emit('leaderboard:update', leaderboard)
      client.emit('leaderboard:tv_mode', { tvMode: this.isTvMode })
      client.emit('leaderboard:reveal_state', { isRevealing: this.isRevealing, round: this.revealRound, step: this.revealStep })
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
    client.emit('leaderboard:reveal_state', { isRevealing: this.isRevealing, round: this.revealRound, step: this.revealStep })
  }

  getTvMode(): boolean {
    return this.isTvMode
  }

  getRevealState() {
    return { isRevealing: this.isRevealing, round: this.revealRound, step: this.revealStep }
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
    try {
      if (!this.server) return
      this.server.to('leaderboard').emit('leaderboard:reveal_start', payload)
      this.server.to('leaderboard').emit('leaderboard:reveal_state', { isRevealing: true, round: this.revealRound, step: 0 })
      console.log('[WS] Reveal broadcast sent:', payload)
    } catch (err) {
      console.error('[WS] Reveal broadcast failed:', err)
    }
  }

  // Called when Admin triggers a finale step (1 = 5th … 5 = Grand Champion)
  async broadcastRevealStep(step: number, round: number = 3) {
    this.isRevealing = true
    this.revealRound = round || 3
    this.revealStep = step
    try {
      if (!this.server) return
      this.server.to('leaderboard').emit('leaderboard:reveal_step', { step, round: this.revealRound })
      this.server.to('leaderboard').emit('leaderboard:reveal_state', { isRevealing: true, round: this.revealRound, step: this.revealStep })
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

  // After Top 5 promotion the public board should show the Top 20 shortlist
  // as a scrolling list — not the finale podium — until admin reveal clicks.
  async showTop20Shortlist() {
    this.isRevealing = false
    this.revealStep = 0
    this.revealRound = 2
    try {
      if (!this.server) return
      this.server.to('leaderboard').emit('leaderboard:reveal_stop', {
        isRevealing: false,
        round: 2,
        step: 0,
      })
      this.server.to('leaderboard').emit('leaderboard:reveal_state', {
        isRevealing: false,
        round: 2,
        step: 0,
      })
      this.server.to('leaderboard').emit('leaderboard:stage', { round: 2 })
    } catch (err) {
      console.error('[WS] Show Top 20 shortlist failed:', err)
    }
  }
}
