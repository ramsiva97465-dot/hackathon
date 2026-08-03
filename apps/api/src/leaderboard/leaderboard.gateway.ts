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
}
