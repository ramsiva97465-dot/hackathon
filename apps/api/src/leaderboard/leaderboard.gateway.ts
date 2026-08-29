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
  }

  getTvMode(): boolean {
    return this.isTvMode
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
    try {
      if (!this.server) return
      this.server.to('leaderboard').emit('leaderboard:reveal_start', payload)
      console.log('[WS] Reveal broadcast sent:', payload)
    } catch (err) {
      console.error('[WS] Reveal broadcast failed:', err)
    }
  }
}
