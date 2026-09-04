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
  private certificatesReleased = false
  private isRevealing = false
  private revealRound = 2
  private revealStep = 0
  private revealStepStartedAt = 0
  private revealNextAllowedAt = 0

  // Special Category ceremony — completely separate from main Top 20 / Top 5.
  private specialIsRevealing = false
  private specialPhase: 'TOP5' | 'FINALE' = 'TOP5'
  private specialStep = 0

  private getRevealStatePayload() {
    return {
      isRevealing: this.isRevealing,
      round: this.revealRound,
      step: this.revealStep,
      startedAt: this.revealStepStartedAt,
      nextAllowedAt: this.revealNextAllowedAt,
    }
  }

  private getSpecialRevealStatePayload() {
    return {
      isRevealing: this.specialIsRevealing,
      phase: this.specialPhase,
      step: this.specialStep,
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
      client.emit('leaderboard:certificates_released', { released: this.certificatesReleased })
      client.emit('leaderboard:reveal_state', this.getRevealStatePayload())
      client.emit('leaderboard:special_reveal_state', this.getSpecialRevealStatePayload())
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
    client.emit('leaderboard:certificates_released', { released: this.certificatesReleased })
    client.emit('leaderboard:reveal_state', this.getRevealStatePayload())
    client.emit('leaderboard:special_reveal_state', this.getSpecialRevealStatePayload())
  }

  getTvMode(): boolean {
    return this.isTvMode
  }

  getCertificatesReleased(): boolean {
    return this.certificatesReleased
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

  // Called when Admin releases / locks participation certificates
  async broadcastCertificatesReleased(released: boolean) {
    this.certificatesReleased = released
    try {
      if (!this.server) return
      this.server.to('leaderboard').emit('leaderboard:certificates_released', { released })
      console.log('[WS] Certificates released broadcast sent:', released)
    } catch (err) {
      console.error('[WS] Certificates released broadcast failed:', err)
    }
  }

  // Called when Admin triggers Stage Grand Reveal
  async broadcastRevealEvent(payload: { round: number; type: string; timestamp: number }) {
    if (this.specialIsRevealing) {
      throw new BadRequestException('Special Category reveal is already running. Stop it before starting the main ceremony.')
    }
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
    // Step 4 runs the Final Two face-off: a ~10s left↔right shuffle of the two
    // remaining laurels before the runner-up locks in as 2nd place.
    const finaleDurations = [0, 41000, 28000, 28000, 28000, 22000]

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
    if (this.specialIsRevealing) {
      await this.broadcastSpecialRevealStop()
    }
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

  getSpecialRevealState() {
    return this.getSpecialRevealStatePayload()
  }

  async broadcastSpecialLeaderboardUpdate() {
    try {
      if (!this.server) return
      const board = await this.leaderboardService.getSpecialLeaderboard({ round: 2 })
      this.server.to('leaderboard').emit('leaderboard:special_update', board)
    } catch (err) {
      console.error('[WS] Special leaderboard broadcast failed:', err)
    }
  }

  async broadcastSpecialRevealStart(phase: 'TOP5' | 'FINALE') {
    if (this.isRevealing) {
      throw new BadRequestException('Main ceremony is already running. Stop it before starting Special Category reveal.')
    }
    this.specialIsRevealing = true
    this.specialPhase = phase
    this.specialStep = 0
    const payload = this.getSpecialRevealStatePayload()
    try {
      if (!this.server) return
      this.server.to('leaderboard').emit('leaderboard:special_reveal_start', payload)
      this.server.to('leaderboard').emit('leaderboard:special_reveal_state', payload)
      console.log('[WS] Special reveal start:', payload)
    } catch (err) {
      console.error('[WS] Special reveal start failed:', err)
    }
  }

  async broadcastSpecialRevealStep(step: number, phase?: 'TOP5' | 'FINALE') {
    if (this.isRevealing) {
      throw new BadRequestException('Main ceremony is running. Stop it before advancing Special Category reveal.')
    }
    const nextPhase = phase || this.specialPhase
    const maxStep = nextPhase === 'TOP5' ? 5 : 2
    if (step < 0 || step > maxStep) {
      throw new BadRequestException(`Special reveal step must be between 0 and ${maxStep}.`)
    }
    if (this.specialIsRevealing && nextPhase === this.specialPhase && step !== 0 && step !== this.specialStep + 1) {
      throw new BadRequestException(`Special reveal step ${this.specialStep + 1} must run next.`)
    }

    this.specialIsRevealing = true
    this.specialPhase = nextPhase
    this.specialStep = step
    const payload = this.getSpecialRevealStatePayload()
    try {
      if (!this.server) return
      this.server.to('leaderboard').emit('leaderboard:special_reveal_step', payload)
      this.server.to('leaderboard').emit('leaderboard:special_reveal_state', payload)
      console.log('[WS] Special reveal step:', payload)
    } catch (err) {
      console.error('[WS] Special reveal step failed:', err)
    }
  }

  async broadcastSpecialRevealStop() {
    this.specialIsRevealing = false
    const payload = this.getSpecialRevealStatePayload()
    try {
      if (!this.server) return
      this.server.to('leaderboard').emit('leaderboard:special_reveal_stop', payload)
      this.server.to('leaderboard').emit('leaderboard:special_reveal_state', payload)
    } catch (err) {
      console.error('[WS] Special reveal stop failed:', err)
    }
  }
}
