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

  constructor(private readonly leaderboardService: LeaderboardService) {}

  handleConnection(client: Socket) {
    console.log(`[WS] Client connected: ${client.id}`)
    client.join('leaderboard')
  }

  handleDisconnect(client: Socket) {
    console.log(`[WS] Client disconnected: ${client.id}`)
  }

  @SubscribeMessage('leaderboard:subscribe')
  async handleSubscribe(client: Socket) {
    const leaderboard = await this.leaderboardService.getLeaderboard()
    client.emit('leaderboard:update', leaderboard)
    client.emit('leaderboard:tv_mode', { tvMode: this.isTvMode })
    client.emit('leaderboard:reveal_state', { isRevealing: this.isRevealing, round: this.revealRound })
  }

  getTvMode(): boolean {
    return this.isTvMode
  }

  getRevealState() {
    return { isRevealing: this.isRevealing, round: this.revealRound }
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

  // Called when Admin triggers Stage Grand Reveal (e.g. Round 2 Top 20 Reveal countdown)
  async broadcastRevealEvent(payload: { round: number; type: string; timestamp: number }) {
    this.isRevealing = true
    this.revealRound = payload.round || 2
    try {
      if (!this.server) return
      this.server.to('leaderboard').emit('leaderboard:reveal_start', payload)
      this.server.to('leaderboard').emit('leaderboard:reveal_state', { isRevealing: true, round: this.revealRound })
      console.log('[WS] Reveal broadcast sent:', payload)
    } catch (err) {
      console.error('[WS] Reveal broadcast failed:', err)
    }
  }

  // Called when Admin stops / closes reveal mode
  async broadcastStopReveal() {
    this.isRevealing = false
    try {
      if (!this.server) return
      this.server.to('leaderboard').emit('leaderboard:reveal_stop', { isRevealing: false })
      this.server.to('leaderboard').emit('leaderboard:reveal_state', { isRevealing: false, round: this.revealRound })
      console.log('[WS] Stop reveal broadcast sent')
    } catch (err) {
      console.error('[WS] Stop reveal broadcast failed:', err)
    }
  }
}
