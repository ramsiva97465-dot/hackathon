import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { SnapServeMark, VobizLockup } from '@/components/brand/BrandLogos'
import { PremiumRevealCard } from '@/components/reveal/PremiumRevealCard'
import { GrandFinaleExperience } from '@/components/reveal/GrandFinaleExperience'
import { Avatar } from '@/components/ui/Avatar'
import { getTrackConfig } from '@/lib/utils'
import { unlockFinaleAudio } from '@/lib/finaleRevealAudio'
import { useWebSocket } from '@/hooks/useWebSocket'
import { 
    TrendingUp, TrendingDown, Minus, Trophy, ChevronRight, Monitor,
  Sparkles, Star, CheckCircle2, Lock, Flame, Zap, Award, Crown, Medal, Layers, ShieldCheck
} from 'lucide-react'
import type { LeaderboardEntry } from '@hackathon/shared'
import api from '@/lib/api'

const ROUND2_CUTOFF = 20 // Top 20 advance to round 2
const FINALE_CUTOFF = 5 // Top 5 Grand Finale winners

function finalePlace(rank: number) {
  if (rank === 1) return { title: 'Grand Champion', decrypt: 'Unsealing Grand Champion (1st Place)...', speak: 'Grand Champion, ', locked: '1st Place Champion' }
  if (rank === 2) return { title: '1st Runner Up', decrypt: 'Decrypting 1st Runner Up (2nd Place)...', speak: '1st Runner Up, ', locked: '1st Runner Up' }
  if (rank === 3) return { title: '2nd Runner Up', decrypt: 'Decrypting 2nd Runner Up (3rd Place)...', speak: '2nd Runner Up, ', locked: '2nd Runner Up' }
  if (rank === 4) return { title: '4th Place', decrypt: 'Decrypting 4th Place...', speak: '4th Place, ', locked: '4th Place' }
  return { title: '5th Place', decrypt: 'Decrypting 5th Place...', speak: '5th Place, ', locked: '5th Place' }
}

/** Step 1=5th … 5=champion — 5th gets slow rain + 5s hold, then a 20s reveal */
function finaleCountdownStart(step: number) {
  if (step === 1) return 33 // 8s rain + 5s hold + 20s reveal
  return 20
}

// ── Cinematic Confetti FX for Grand Finale ────────────────────────────────────
function triggerFinaleConfetti(rank: number) {
  try {
    if (rank === 3) {
      // Bronze confetti burst from right
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { x: 0.8, y: 0.6 },
        colors: ['#b45309', '#d97706', '#f59e0b', '#fbbf24', '#ffffff']
      })
    } else if (rank === 2) {
      // Silver confetti burst from left
      confetti({
        particleCount: 95,
        spread: 75,
        origin: { x: 0.2, y: 0.6 },
        colors: ['#94a3b8', '#cbd5e1', '#e2e8f0', '#38bdf8', '#ffffff']
      })
    } else if (rank === 4 || rank === 5) {
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.65 },
        colors: ['#78716c', '#a8a29e', '#e7e5e4', '#ffffff']
      })
    } else if (rank === 1) {
      // 👑 GRAND CHAMPION DUAL CANNON & FIREWORKS SHOWER (3.5s celebration)
      const duration = 3.5 * 1000
      const end = Date.now() + duration
      const colors = ['#E83C00', '#F59E0B', '#FFD700', '#FBBF24', '#FFFFFF', '#10B981']

      ;(function frame() {
        confetti({
          particleCount: 7,
          angle: 60,
          spread: 65,
          origin: { x: 0, y: 0.75 },
          colors
        })
        confetti({
          particleCount: 7,
          angle: 120,
          spread: 65,
          origin: { x: 1, y: 0.75 },
          colors
        })
        confetti({
          particleCount: 5,
          spread: 360,
          startVelocity: 30,
          origin: { x: 0.5, y: 0.35 },
          colors
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      })()
    }
  } catch (e) {
    // Non-blocking fallback
  }
}

// ── Web Audio Synth for Dramatic Reveal Fanfares ──────────────────────────────
function playRevealChime(rank: number) {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()

    const isChampion = rank === 1
    const isSilver = rank === 2
    const isBronze = rank === 3

    if (isChampion) {
      // 1. Deep Sub-Bass Rumble
      const subOsc = ctx.createOscillator()
      const subGain = ctx.createGain()
      subOsc.type = 'sine'
      subOsc.frequency.setValueAtTime(65, ctx.currentTime)
      subOsc.frequency.exponentialRampToValueAtTime(130, ctx.currentTime + 0.5)
      subGain.gain.setValueAtTime(0.35, ctx.currentTime)
      subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2)
      subOsc.connect(subGain)
      subGain.connect(ctx.destination)
      subOsc.start(ctx.currentTime)
      subOsc.stop(ctx.currentTime + 2.2)

      // 2. Royal Champion Harmonic Chords (C5 -> E5 -> G5 -> C6 -> E6 -> G6)
      const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12)
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12)
        gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + idx * 0.12 + 0.04)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 2.4)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime + idx * 0.12)
        osc.stop(ctx.currentTime + idx * 0.12 + 2.5)
      })
    } else if (isSilver) {
      // Silver 1st Runner Up (Bright Crystal Chimes D5 -> F#5 -> A5 -> D6)
      const freqs = [587.33, 739.99, 880.00, 1174.66]
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1)
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.1)
        gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + idx * 0.1 + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 1.2)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime + idx * 0.1)
        osc.stop(ctx.currentTime + idx * 0.1 + 1.3)
      })
    } else if (isBronze) {
      // Bronze 2nd Runner Up (Warm Brass Chimes E5 -> G#5 -> B5 -> E6)
      const freqs = [440.00, 554.37, 659.25, 880.00]
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1)
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.1)
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + idx * 0.1 + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 1.0)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime + idx * 0.1)
        osc.stop(ctx.currentTime + idx * 0.1 + 1.1)
      })
    } else {
      // Top 20 countdown ping
      const freqs = [392.00, 523.25, 659.25]
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08)
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08)
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + idx * 0.08 + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.6)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime + idx * 0.08)
        osc.stop(ctx.currentTime + idx * 0.08 + 0.65)
      })
    }
  } catch (e) {
    // Audio may be muted before first user interaction
  }
}

function playHeartbeatTick(intensity = 1) {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    
    // Sub-bass thumping heartbeat tick with dynamic pitch & volume
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    const baseFreq = 48 + (intensity * 6)
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, ctx.currentTime + 0.22)
    
    const vol = Math.min(0.65, 0.35 + (intensity * 0.06))
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  } catch (e) {
    //
  }
}

function speakCountdown(text: string, rate = 0.85, pitch = 1.0) {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = 1.0
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en-US'))
    if (preferred) utterance.voice = preferred
    window.speechSynthesis.speak(utterance)
  } catch (e) {
    // Ignore speech synthesis errors
  }
}

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1,  teamId: '1',  teamName: 'SpeakSense',    college: 'BITS Pilani',     track: 'REAL_WORLD_DEPLOYMENT', totalScore: 91.2, judgeCount: 6, previousRank: 2,  scores: [] },
  { rank: 2,  teamId: '2',  teamName: 'AudioMind',     college: 'VIT Chennai',     track: 'VOICE_AI_AGENT',        totalScore: 88.7, judgeCount: 5, previousRank: 1,  scores: [] },
  { rank: 3,  teamId: '3',  teamName: 'NovaTalk',      college: 'NIT Trichy',      track: 'MULTIMODAL_AI',         totalScore: 84.5, judgeCount: 5, previousRank: 3,  scores: [] },
  { rank: 4,  teamId: '4',  teamName: 'VoiceForge AI', college: 'IIT Madras',      track: 'VOICE_AI_AGENT',        totalScore: 81.0, judgeCount: 4, previousRank: 5,  scores: [] },
  { rank: 5,  teamId: '5',  teamName: 'EchoBot Labs',  college: 'SRM University',  track: 'MULTIMODAL_AI',         totalScore: 79.3, judgeCount: 4, previousRank: 4,  scores: [] },
  { rank: 6,  teamId: '6',  teamName: 'DeepVoice',     college: 'SASTRA',          track: 'VOICE_AI_AGENT',        totalScore: 75.8, judgeCount: 3, previousRank: 6,  scores: [] },
  { rank: 7,  teamId: '7',  teamName: 'TalkFlow',      college: 'Amrita',          track: 'REAL_WORLD_DEPLOYMENT', totalScore: 72.1, judgeCount: 3, previousRank: 8,  scores: [] },
  { rank: 8,  teamId: '8',  teamName: 'MindSpeak',     college: 'SSN Engineering', track: 'MULTIMODAL_AI',         totalScore: 68.4, judgeCount: 2, previousRank: 7,  scores: [] },
  { rank: 9,  teamId: '9',  teamName: 'VoicePilot',    college: 'PSG Tech',        track: 'VOICE_AI_AGENT',        totalScore: 65.0, judgeCount: 2, previousRank: 9,  scores: [] },
  { rank: 10, teamId: '10', teamName: 'LinguaBot',     college: 'Loyola',          track: 'MULTIMODAL_AI',         totalScore: 62.3, judgeCount: 2, previousRank: 11, scores: [] },
]

function Delta({ curr, prev }: { curr: number; prev?: number }) {
  if (!prev || curr === prev) return <Minus size={13} className="text-slate-400" />
  if (curr < prev) return (
    <div className="flex items-center gap-0.5 text-emerald-600 text-xs font-bold">
      <TrendingUp size={13} />{prev - curr}
    </div>
  )
  return (
    <div className="flex items-center gap-0.5 text-red-500 text-xs font-bold">
      <TrendingDown size={13} />{curr - prev}
    </div>
  )
}

// ── Round 1 Row (Scores Hidden, Live Evaluation 0/1 -> 1/1) ───────────────────
function Round1Row({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const track = getTrackConfig(entry.track)
  const isJudged = entry.judgeCount > 0

  return (
    <motion.div
      key={entry.teamId}
      layout
      layoutId={entry.teamId}
      className={`grid grid-cols-[56px_1fr_170px_110px_110px] px-6 py-3.5 items-center border-b transition-colors ${
        isJudged
          ? 'bg-[#F4ECE1] hover:bg-white/60 border-black/5'
          : 'bg-[#EBE3D5]/50 hover:bg-[#EBE3D5] border-black/[0.04]'
      }`}
    >
      {/* S.No / ID */}
      <div className="flex items-center justify-center">
        <span className="text-sm font-bold text-slate-400">#{index + 1}</span>
      </div>

      {/* Team */}
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={entry.teamName} size="sm" className={`shrink-0 ring-2 ${isJudged ? 'ring-white shadow-sm' : 'ring-white/50'}`} />
        <div className="min-w-0">
          <div className="font-bold truncate text-slate-900 text-sm">
            {entry.teamName}
          </div>
          <div className="text-xs text-slate-400 truncate">{entry.college}</div>
        </div>
      </div>

      {/* Track */}
      <div>
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border bg-white shadow-sm"
          style={{ color: track.color, borderColor: `${track.color}30` }}
        >
          {track.label}
        </span>
      </div>

      {/* Judges Status (0/1 -> 1/1) */}
      <div className="flex justify-center">
        {isJudged ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm font-mono">
            <CheckCircle2 size={12} className="text-emerald-600" />
            1 / 1
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200/80 text-slate-500 border border-slate-300 font-mono">
            0 / 1
          </span>
        )}
      </div>

      {/* Status (Score is hidden during Round 1) */}
      <div className="text-right">
        {isJudged ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 uppercase tracking-wider">
            <ShieldCheck size={12} className="text-emerald-600 stroke-[2.5]" />
            Evaluated
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            In Progress
          </span>
        )}
      </div>
    </motion.div>
  )
}


// ── Round 2 Table Row ─────────────────────────────────────────────────────────
function Round2Row({ entry, hideStandings }: { entry: LeaderboardEntry; hideStandings?: boolean }) {
  const track = getTrackConfig(entry.track)
  if (hideStandings) {
    return (
      <motion.div
        key={entry.teamId}
        layout
        layoutId={`r2-${entry.teamId}`}
        className="grid grid-cols-[1fr_200px] px-8 py-5 items-center border-b border-black/5 hover:bg-white/50 transition-colors"
      >
        <div className="flex items-center gap-4 min-w-0">
          <Avatar name={entry.teamName} size="md" className="shadow-sm ring-2 ring-white" />
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-900 truncate">{entry.teamName}</div>
            <div className="text-sm font-medium text-slate-500 truncate">{entry.college}</div>
          </div>
        </div>
        <div>
          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm bg-white"
            style={{ color: track.color, borderColor: `${track.color}40` }}>
            {track.label}
          </span>
        </div>
      </motion.div>
    )
  }
  return (
    <motion.div
      key={entry.teamId}
      layout
      layoutId={`r2-${entry.teamId}`}
      className="grid grid-cols-[80px_1fr_200px_120px_120px_80px] px-8 py-5 items-center border-b border-black/5 hover:bg-white/50 transition-colors"
    >
      <div className="text-xl font-black text-slate-400 text-center">{entry.rank}</div>
      <div className="flex items-center gap-4 min-w-0">
        <Avatar name={entry.teamName} size="md" className="shadow-sm ring-2 ring-white" />
        <div className="min-w-0">
          <div className="text-lg font-bold text-slate-900 truncate">{entry.teamName}</div>
          <div className="text-sm font-medium text-slate-500 truncate">{entry.college}</div>
        </div>
      </div>
      <div>
        <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm bg-white"
          style={{ color: track.color, borderColor: `${track.color}40` }}>
          {track.label}
        </span>
      </div>
      <div className="text-center text-slate-500 font-mono font-semibold">{entry.judgeCount > 0 ? '1 / 1' : '0 / 1'}</div>
      <motion.div key={entry.totalScore} initial={{ scale: 1.15 }} animate={{ scale: 1 }}
        className="text-right text-2xl font-black text-slate-900">
        {entry.totalScore.toFixed(1)}
      </motion.div>
      <div className="flex justify-end"><Delta curr={entry.rank} prev={entry.previousRank} /></div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [clock, setClock] = useState(new Date())
  const [activeRound, setActiveRound] = useState<number>(1)
  const [tvMode, setTvMode] = useState(() => {
    return localStorage.getItem('snapserve_tv_mode') === 'true'
  })

  // ── Grand Reveal State ─────────────────────────────────────────────────────
  // For Round 2: revealedStep 0..20 (Rank 20 down to 1)
  // For Round 3: revealedStep 0..5 (Rank 5 down to 1)
  // URL never starts a ceremony. Only admin reveal_start / reveal_step does.
  const [revealRound, setRevealRound] = useState<number>(2)
  const [isRevealing, setIsRevealing] = useState<boolean>(false)
  const [revealedStep, setRevealedStep] = useState<number>(0)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [soundEnabled] = useState<boolean>(true)
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false)
  const [decryptingRank, setDecryptingRank] = useState<number | null>(null)
  const [revealingTeamName, setRevealingTeamName] = useState('')
  const [nameSpinMs, setNameSpinMs] = useState(5000)
  const [finaleStepStartedAt, setFinaleStepStartedAt] = useState(0)
  const [unlockedRanks, setUnlockedRanks] = useState<number[]>([])
  const unlockedRanksRef = useRef<number[]>([])
  const rosterRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const activeRoundRef = useRef(activeRound)
  // Reveal progress is also polled every 3s. Refs keep the socket handler and
  // the poll from skipping an in-flight countdown via stale state.
  const revealedStepRef = useRef(revealedStep)
  const isDecryptingRef = useRef(false)
  const isRevealingRef = useRef(false)
  const revealRoundRef = useRef(2)
  const animatingStepRef = useRef(0)
  // A countdown announces its winner up to 10s after it was triggered, so the
  // name must be read when it is spoken, not when the trigger arrived.
  const top5Ref = useRef<Array<LeaderboardEntry & { rank: number }>>([])
  const advancingRef = useRef<Array<LeaderboardEntry & { rank: number }>>([])
  const revealCompletionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasAutoScrolledRef = useRef(false)
  const holdStartedRef = useRef(false)
  const [rosterShown, setRosterShown] = useState(false)

  useEffect(() => {
    activeRoundRef.current = activeRound
  }, [activeRound])

  useEffect(() => {
    revealedStepRef.current = revealedStep
  }, [revealedStep])

  useEffect(() => {
    isDecryptingRef.current = isDecrypting
  }, [isDecrypting])

  useEffect(() => {
    unlockedRanksRef.current = unlockedRanks
  }, [unlockedRanks])

  useEffect(() => {
    isRevealingRef.current = isRevealing
  }, [isRevealing])

  useEffect(() => {
    revealRoundRef.current = revealRound
  }, [revealRound])

  // LCD autoplay policy: unlock Web Audio on first gesture so the 10s bed can play.
  useEffect(() => {
    const unlock = () => unlockFinaleAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  const applyLeaderboardRows = (rows: unknown) => {
    if (!Array.isArray(rows)) return
    setEntries((prev) => (rows.length === 0 && prev.length > 0 ? prev : rows))
  }

  const { emit } = useWebSocket<LeaderboardEntry[]>('leaderboard:update', async () => {
    try {
      const fetchRound = activeRoundRef.current === 3 ? 2 : activeRoundRef.current
      const res = await api.leaderboard.get({ round: fetchRound })
      applyLeaderboardRows(res.data)
    } catch {
      // Ignore live refresh errors
    }
  })

  // Listen for broadcasted reveal triggers from admin panel
  useWebSocket<{ round?: number; type?: string }>('leaderboard:reveal_start', (data) => {
    startGrandReveal(data?.round || 2)
  })

  useWebSocket<{ step: number; round?: number; startedAt?: number }>('leaderboard:reveal_step', (data) => {
    if (typeof data?.step !== 'number') return
    const targetRound = data.round || 3
    if (targetRound !== revealRoundRef.current || !isRevealingRef.current) {
      setRevealRound(targetRound)
      // Keep fetching the Top 20 payload (includes finalists). A round-3
      // query can come back empty and wipe the winner card after countdown.
      setActiveRound(targetRound === 3 ? 2 : targetRound)
      setIsRevealing(true)
    }
    executeRevealToStep(data.step, targetRound, { startedAt: data.startedAt })
  })

  useWebSocket<{ isRevealing: boolean }>('leaderboard:reveal_stop', () => {
    if (isRevealingRef.current) stopGrandReveal(true)
  })

  useWebSocket<{ isRevealing: boolean; round?: number; step?: number; startedAt?: number }>('leaderboard:reveal_state', (data) => {
    applyServerRevealState(data, 'poll')
  })

  // Listen for broadcasted TV Mode toggles from admin panel
  useWebSocket<{ round?: number }>('leaderboard:stage', (data) => {
    if (typeof data?.round !== 'number') return
    isRevealingRef.current = false
    setIsRevealing(false)
    setActiveRound(data.round)
  })

  useWebSocket<{ tvMode: boolean }>('leaderboard:tv_mode', (data) => {
    if (typeof data?.tvMode === 'boolean') {
      setTvMode(data.tvMode)
      localStorage.setItem('snapserve_tv_mode', data.tvMode ? 'true' : 'false')
    }
  })

  const fetchLiveLeaderboard = async () => {
    try {
      const fetchRound = activeRound === 3 ? 2 : activeRound
      const res = await api.leaderboard.get({ round: fetchRound })
      applyLeaderboardRows(res.data)
    } catch (err) {
      // Ignore poll error
    }
  }

  const fetchTvModeState = async () => {
    try {
      const res = await api.leaderboard.getTvMode()
      if (typeof res.data?.tvMode === 'boolean') {
        setTvMode(res.data.tvMode)
        localStorage.setItem('snapserve_tv_mode', res.data.tvMode ? 'true' : 'false')
      }
    } catch (err) {
      // Ignore
    }
  }

  const showRosterIfCeremonyComplete = (serverStep: number, targetRound: number) => {
    if (targetRound === 3) return
    if (serverStep >= 20 && !isDecryptingRef.current) {
      hasAutoScrolledRef.current = true
      holdStartedRef.current = true
      setRosterShown(true)
    }
  }

  const applyServerRevealState = (
    data: { isRevealing?: boolean; round?: number; step?: number; startedAt?: number } | undefined,
    source: 'poll' | 'event',
  ) => {
    if (!data) return
    if (!data.isRevealing) {
      if (isRevealingRef.current) stopGrandReveal(true)
      return
    }

    const targetRound = data.round || 2
    const serverStep = typeof data.step === 'number' ? data.step : 0

    // Poll / reconnect may catch a late LCD up. It must never restart a
    // ceremony (startGrandReveal resets to step 0) and must never animate
    // several places from one leftover state payload.
    if (
      !isRevealingRef.current
      || revealRoundRef.current !== targetRound
      || (targetRound === 3 && revealedStepRef.current > FINALE_CUTOFF)
    ) {
      // Top 20 auto-play leaves revealedStep at 20. That leftover must not
      // unlock the finale podium or skip the 5th/4th countdown.
      if (revealRoundRef.current !== targetRound || (targetRound === 3 && revealedStepRef.current > FINALE_CUTOFF)) {
        resetRevealProgress()
      }
      revealRoundRef.current = targetRound
      isRevealingRef.current = true
      setRevealRound(targetRound)
      setActiveRound(targetRound === 3 ? 2 : targetRound)
      setIsRevealing(true)
      if (serverStep <= 0) {
        resetRevealProgress()
      } else {
        executeRevealToStep(serverStep, targetRound, {
          catchUp: source === 'poll',
          startedAt: data.startedAt,
        })
        showRosterIfCeremonyComplete(serverStep, targetRound)
      }
      return
    }

    // A leftover step-0 poll (ceremony opened but no place clicked yet)
    // must never rewind a place the LCD already unsealed.
    if (serverStep > revealedStepRef.current) {
      executeRevealToStep(serverStep, targetRound, {
        catchUp: source === 'poll',
        startedAt: data.startedAt,
      })
      showRosterIfCeremonyComplete(serverStep, targetRound)
    }
  }

  const fetchRevealState = async () => {
    try {
      const res = await api.leaderboard.getRevealState()
      applyServerRevealState(res.data, 'poll')
    } catch (err) {
      // Ignore
    }
  }

  useEffect(() => { emit('leaderboard:subscribe') }, [emit])

  // One-time user interaction listener to wake up browser audio context
  useEffect(() => {
    const handleFirstInteraction = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContext) {
          const ctx = new AudioContext()
          if (ctx.state === 'suspended') ctx.resume()
        }
        if ('speechSynthesis' in window) {
          window.speechSynthesis.resume()
          window.speechSynthesis.getVoices()
        }
      } catch (e) {}
    }
    window.addEventListener('click', handleFirstInteraction, { once: true })
    window.addEventListener('keydown', handleFirstInteraction, { once: true })
    return () => {
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
    }
  }, [])

  useEffect(() => {
    fetchLiveLeaderboard()
    fetchTvModeState()
    fetchRevealState()
    const pollTimer = setInterval(() => {
      fetchLiveLeaderboard()
      fetchTvModeState()
      fetchRevealState()
    }, 3000)

    const handleUpdateEvent = () => {
      fetchLiveLeaderboard()
      fetchRevealState()
      const stored = localStorage.getItem('snapserve_tv_mode') === 'true'
      setTvMode(stored)
    }

    window.addEventListener('leaderboard_updated', handleUpdateEvent)
    window.addEventListener('tv_mode_toggled', handleUpdateEvent)
    window.addEventListener('storage', handleUpdateEvent)

    return () => {
      clearInterval(pollTimer)
      window.removeEventListener('leaderboard_updated', handleUpdateEvent)
      window.removeEventListener('tv_mode_toggled', handleUpdateEvent)
      window.removeEventListener('storage', handleUpdateEvent)
    }
  }, [activeRound])

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // After Top 5 promotion, keep the public board on the Top 20 list.
  // Do not jump to the finale podium until an admin reveal step arrives.
  useEffect(() => {
    if (isRevealing || isRevealingRef.current) return
    const hasFinalists = entries.some((e) => ((e as any).round || 1) === 3)
    if (hasFinalists && activeRound !== 2) {
      setActiveRound(2)
    }
  }, [entries, isRevealing, activeRound])

  useEffect(() => {
    const handleStorage = () => {
      const val = localStorage.getItem('snapserve_tv_mode') === 'true'
      setTvMode(val)
    }
    window.addEventListener('storage', handleStorage)
    window.addEventListener('tv_mode_toggled', handleStorage)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('tv_mode_toggled', handleStorage)
    }
  }, [])

  // TV Mode Auto-scroll logic (buttery smooth 60fps requestAnimationFrame with sub-pixel float accumulator)
  useEffect(() => {
    const waitingForFinale = entries.some((e) => ((e as any).round || 1) === 3)
    if (isRevealing) return
    if (!tvMode && !waitingForFinale) return

    let animId: number
    let scrollingUp = false
    let currentScroll = scrollContainerRef.current?.scrollTop || 0
    let lastTime = performance.now()

    const step = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now

      const el = scrollContainerRef.current
      if (el && !scrollingUp) {
        // Comfortable, readable speed: 24 pixels per second
        currentScroll += 24 * dt
        el.scrollTop = Math.floor(currentScroll)

        // Check if reached the bottom
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 15) {
          scrollingUp = true
          el.scrollTo({ top: 0, behavior: 'smooth' })
          currentScroll = 0
          setTimeout(() => {
            scrollingUp = false
            currentScroll = 0
            lastTime = performance.now()
          }, 3500)
        }
      }

      animId = requestAnimationFrame(step)
    }

    animId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animId)
  }, [tvMode, isRevealing, entries.length, activeRound])

  const rawDisplay = entries

  // ── Round-based filtering ──────────────────────────────────────────────────
  const filtered = rawDisplay
    .filter(e => {
      const teamRound = (e as any).round || 1
      if (activeRound === 3) return teamRound === 3
      if (activeRound === 2) {
        // During the Top 20 ceremony keep every scored team so the table
        // cannot go empty if a round-2 fetch has not landed yet.
        if (isRevealingRef.current && revealRoundRef.current !== 3) return true
        return teamRound >= 2
      }
      return true // Round 1: show all
    })
    .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
    .map((e, idx) => ({ ...e, rank: idx + 1 }))

  // Advancing Top 20 (sorted 1 to 20)
  const advancing = filtered.slice(0, ROUND2_CUTOFF)
  const notAdvancing = filtered.slice(ROUND2_CUTOFF)
  if (advancing.length > 0) advancingRef.current = advancing

  // Official Top 5 for Grand Finale.
  // If teams were promoted to Round 3, use those; otherwise fall back to overall ranking.
  const r3Teams = rawDisplay.filter(e => ((e as any).round || 1) === 3)
  const top5Source = r3Teams.length > 0 ? r3Teams : (filtered.length > 0 ? filtered : rawDisplay)
  const top5 = top5Source
    .slice()
    .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
    .slice(0, FINALE_CUTOFF)
    .map((e, idx) => ({ ...e, rank: idx + 1 }))

  if (top5.length > 0) top5Ref.current = top5

  const finalePodiumOrder = [
    top5[3],
    top5[1],
    top5[0],
    top5[2],
    top5[4],
  ]

  const isFinale = revealRound === 3
  const maxSteps = isFinale ? FINALE_CUTOFF : Math.min(20, advancing.length || 20)

  // ── Grand Reveal Logic ─────────────────────────────────────────────────────
  const startGrandReveal = (round: number = 2) => {
    // A late reveal_state / poll must never rewind a countdown that is already
    // playing on the LCD, otherwise the same slot would animate twice.
    if (isDecryptingRef.current && round === revealRoundRef.current) {
      isRevealingRef.current = true
      setIsRevealing(true)
      return
    }
    revealRoundRef.current = round
    isRevealingRef.current = true
    setRevealRound(round)
    setActiveRound(round === 3 ? 2 : round)
    setIsRevealing(true)
    animatingStepRef.current = 0
    isDecryptingRef.current = false
    revealedStepRef.current = 0
    setRevealedStep(0)
    setUnlockedRanks([])
    unlockedRanksRef.current = []
    setIsPaused(false)
    hasAutoScrolledRef.current = false
    holdStartedRef.current = false
    setRosterShown(false)
    if (autoScrollTimerRef.current) {
      clearTimeout(autoScrollTimerRef.current)
      autoScrollTimerRef.current = null
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const stopGrandReveal = (keepFinaleStep = false) => {
    const wasRevealing = isRevealingRef.current
    const leavingRound = revealRoundRef.current
    if (revealCompletionTimerRef.current) {
      clearTimeout(revealCompletionTimerRef.current)
      revealCompletionTimerRef.current = null
    }
    isDecryptingRef.current = false
    animatingStepRef.current = 0
    setIsDecrypting(false)
    setIsRevealing(false)
    isRevealingRef.current = false
    if (!keepFinaleStep || leavingRound !== 3) {
      resetRevealProgress()
    }
    // Stay on the ceremony round only if we were actually in a reveal.
    // A leftover stop after Promote Top 20 must not flip the LCD to Round 2.
    if (wasRevealing && leavingRound >= 2) {
      setActiveRound(leavingRound === 3 ? 2 : leavingRound)
    }
  }

  const resetRevealProgress = () => {
    if (revealCompletionTimerRef.current) {
      clearTimeout(revealCompletionTimerRef.current)
      revealCompletionTimerRef.current = null
    }
    animatingStepRef.current = 0
    isDecryptingRef.current = false
    revealedStepRef.current = 0
    setRevealedStep(0)
    setIsDecrypting(false)
    setFinaleStepStartedAt(0)
    setUnlockedRanks([])
    setRevealingTeamName('')
    hasAutoScrolledRef.current = false
    holdStartedRef.current = false
    setRosterShown(false)
    if (autoScrollTimerRef.current) {
      clearTimeout(autoScrollTimerRef.current)
      autoScrollTimerRef.current = null
    }
  }

  const executeRevealToStep = (
    requestedStep: number,
    targetRound?: number,
    options?: { catchUp?: boolean; startedAt?: number },
  ) => {
    const effectiveRound = targetRound || revealRoundRef.current || 3
    if (
      (targetRound && targetRound !== revealRoundRef.current)
      || (effectiveRound === 3 && revealedStepRef.current > FINALE_CUTOFF)
    ) {
      resetRevealProgress()
      revealRoundRef.current = effectiveRound
      setRevealRound(effectiveRound)
      setActiveRound(effectiveRound === 3 ? 2 : effectiveRound)
    }
    if (!isRevealingRef.current) {
      isRevealingRef.current = true
      setIsRevealing(true)
    }

    if (requestedStep <= 0) {
      resetRevealProgress()
      return
    }

    const isFinaleStep = effectiveRound === 3
    const lastStep = isFinaleStep ? FINALE_CUTOFF : maxSteps
    const requestedRank = isFinaleStep ? (FINALE_CUTOFF + 1 - requestedStep) : (21 - requestedStep)

    // Already unsealed, or this exact step is mid-countdown right now.
    if (isFinaleStep && requestedStep <= revealedStepRef.current) return
    if (!isFinaleStep && unlockedRanksRef.current.includes(requestedRank) && !options?.catchUp) return
    if (isDecryptingRef.current) return
    if (isFinaleStep && revealedStepRef.current >= lastStep) return
    if (isFinaleStep && !options?.catchUp && requestedStep !== revealedStepRef.current + 1) return
    if (!isFinaleStep && !options?.catchUp) {
      let nextRank = 20
      for (let r = 20; r >= 1; r--) {
        if (!unlockedRanksRef.current.includes(r)) {
          nextRank = r
          break
        }
      }
      if (requestedRank !== nextRank) return
    }

    // Both ceremonies unseal exactly the next place: Top 20 is 20→1, finale is 5→1.
    const targetStep = options?.catchUp
      ? Math.min(requestedStep, lastStep)
      : Math.min(requestedStep, revealedStepRef.current + 1, lastStep)

    const currentRank = isFinaleStep ? (FINALE_CUTOFF + 1 - targetStep) : (21 - targetStep)

    const winnerName = isFinaleStep
      ? (top5Ref.current[currentRank - 1]?.teamName || '')
      : (advancingRef.current[currentRank - 1]?.teamName || '')
    const spinMs = isFinaleStep ? finaleCountdownStart(targetStep) * 1000 : 5000
    const startedAt = isFinaleStep ? (options?.startedAt || Date.now()) : Date.now()
    const elapsed = Math.max(0, Date.now() - startedAt)
    const remainingMs = Math.max(0, spinMs - elapsed)

    if (isFinaleStep) setFinaleStepStartedAt(startedAt)

    // A late screen resumes an in-flight finale from the server timestamp.
    // Completed steps catch up silently so refreshes never replay a winner.
    if (options?.catchUp && (!isFinaleStep || remainingMs <= 0)) {
      revealedStepRef.current = targetStep
      setRevealedStep(targetStep)
      setIsDecrypting(false)
      if (!isFinaleStep && targetStep > 0) {
        const recovered = Array.from({ length: targetStep }, (_, i) => 21 - (i + 1))
        unlockedRanksRef.current = recovered
        setUnlockedRanks(recovered)
      }
      return
    }

    animatingStepRef.current = targetStep
    isDecryptingRef.current = true
    revealedStepRef.current = targetStep
    setIsDecrypting(true)
    setDecryptingRank(currentRank)
    setRevealingTeamName(winnerName)
    setNameSpinMs(spinMs)
    setRevealedStep(targetStep)

    if (revealCompletionTimerRef.current) {
      clearTimeout(revealCompletionTimerRef.current)
    }
    revealCompletionTimerRef.current = window.setTimeout(() => {
      revealCompletionTimerRef.current = null
      if (!isRevealingRef.current || animatingStepRef.current !== targetStep) return
      isDecryptingRef.current = false
      animatingStepRef.current = 0
      setIsDecrypting(false)
      if (!isFinaleStep) {
        unlockedRanksRef.current = unlockedRanksRef.current.includes(currentRank)
          ? unlockedRanksRef.current
          : [...unlockedRanksRef.current, currentRank]
        setUnlockedRanks(unlockedRanksRef.current)
      }
      if (soundEnabled && !isFinaleStep) {
        playRevealChime(currentRank)
      }
      if (isFinaleStep) {
        triggerFinaleConfetti(currentRank)
        const place = finalePlace(currentRank)
        speakCountdown((currentRank === 1 ? 'Grand Champion, ' : place.speak) + winnerName)
      } else {
        speakCountdown(`Number ${currentRank}, ` + winnerName)
      }
    }, remainingMs)
  }

  const scrollQualifierRankIntoView = (rank: number, offset = 12) => {
    const container = scrollContainerRef.current
    const row = rowRefs.current[rank]
    if (!container) return
    if (!row) {
      container.scrollTop = 0
      return
    }
    const top = Math.max(
      0,
      container.scrollTop + row.getBoundingClientRect().top - container.getBoundingClientRect().top - offset,
    )
    container.scrollTop = top
  }

  const jumpToTop20Table = () => {
    hasAutoScrolledRef.current = true
    setRosterShown(true)
    requestAnimationFrame(() => {
      const el = scrollContainerRef.current
      if (el) el.scrollTop = 0
    })
  }

  // When a new countdown/decrypt starts, immediately scroll the hero card back to top
  useEffect(() => {
    if (!isDecrypting) return
    if (holdStartedRef.current || hasAutoScrolledRef.current) return
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [isDecrypting])

  // After #1 is announced, hold that card for 15 seconds, then jump to the Top 20 table.
  // Once the hold starts, polls / clock ticks must never cancel it.
  useEffect(() => {
    if (!isRevealing) {
      hasAutoScrolledRef.current = false
      holdStartedRef.current = false
      setRosterShown(false)
      if (autoScrollTimerRef.current) {
        clearTimeout(autoScrollTimerRef.current)
        autoScrollTimerRef.current = null
      }
      return
    }

    const isAllAnnounced = isFinale
      ? revealedStep >= FINALE_CUTOFF
      : (revealedStep >= 20 || unlockedRanks.length >= 20)

    if (isDecrypting || !isAllAnnounced) {
      if (holdStartedRef.current || hasAutoScrolledRef.current) return
      if (autoScrollTimerRef.current) {
        clearTimeout(autoScrollTimerRef.current)
        autoScrollTimerRef.current = null
      }
      return
    }

    if (hasAutoScrolledRef.current || holdStartedRef.current || autoScrollTimerRef.current) return

    holdStartedRef.current = true
    autoScrollTimerRef.current = setTimeout(() => {
      autoScrollTimerRef.current = null
      jumpToTop20Table()
    }, 15000)
  }, [isRevealing, revealedStep, isFinale, unlockedRanks.length, isDecrypting])

  // After the jump, slowly crawl #1 → #20, pause, then return to #1 and repeat.
  useEffect(() => {
    if (!isRevealing || !rosterShown || isFinale || isDecrypting) return

    const SPEED_PX_PER_SEC = 24
    const RANK_DWELL_MS = 2200
    const BOTTOM_PAUSE_MS = 2200
    const TOP_PAUSE_MS = 1800
    let animId = 0
    let lastTime = performance.now()
    let phase: 'wait' | 'down' | 'pause-bottom' | 'pause-top' = 'wait'
    let phaseUntil = Date.now() + 800
    let cancelled = false
    let rankIndex = 1
    let useRankFallback = false
    let currentScroll = scrollContainerRef.current?.scrollTop || 0
    const totalRanks = Math.min(20, advancingRef.current.length || 20)

    const getMaxScroll = (el: HTMLDivElement) => Math.max(0, el.scrollHeight - el.clientHeight)

    const scrollToFirstTeam = () => scrollQualifierRankIntoView(1)

    const step = (now: number) => {
      if (cancelled) return
      const el = scrollContainerRef.current
      if (!el) {
        animId = requestAnimationFrame(step)
        return
      }

      const maxScroll = getMaxScroll(el)
      useRankFallback = maxScroll <= 4

      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now
      const nowMs = Date.now()

      if (phase === 'wait') {
        if (nowMs >= phaseUntil) {
          phase = 'down'
          rankIndex = 1
          currentScroll = el.scrollTop
          if (useRankFallback) {
            scrollQualifierRankIntoView(1)
            phaseUntil = nowMs + RANK_DWELL_MS
          }
        }
      } else if (phase === 'down') {
        if (useRankFallback) {
          if (nowMs >= phaseUntil) {
            if (rankIndex < totalRanks) {
              rankIndex += 1
              scrollQualifierRankIntoView(rankIndex)
              phaseUntil = nowMs + RANK_DWELL_MS
            } else {
              phase = 'pause-bottom'
              phaseUntil = nowMs + BOTTOM_PAUSE_MS
            }
          }
        } else {
          const before = el.scrollTop
          // Keep sub-pixel progress outside the DOM. Some Chrome/LED display
          // combinations round scrollTop writes, otherwise a ~0.4px frame
          // repeatedly becomes zero and the table appears frozen.
          currentScroll = Math.min(maxScroll, Math.max(currentScroll, before) + SPEED_PX_PER_SEC * dt)
          el.scrollTop = currentScroll
          if (currentScroll >= maxScroll - 1) {
            phase = 'pause-bottom'
            phaseUntil = nowMs + BOTTOM_PAUSE_MS
          }
        }
      } else if (phase === 'pause-bottom') {
        if (nowMs >= phaseUntil) {
          scrollToFirstTeam()
          currentScroll = scrollContainerRef.current?.scrollTop || 0
          rankIndex = 1
          phase = 'pause-top'
          phaseUntil = nowMs + TOP_PAUSE_MS
        }
      } else if (phase === 'pause-top') {
        if (nowMs >= phaseUntil) {
          phase = 'down'
          currentScroll = el.scrollTop
          if (useRankFallback) {
            scrollQualifierRankIntoView(1)
            phaseUntil = nowMs + RANK_DWELL_MS
          }
        }
      }

      animId = requestAnimationFrame(step)
    }

    animId = requestAnimationFrame(step)
    return () => {
      cancelled = true
      cancelAnimationFrame(animId)
    }
  }, [isRevealing, rosterShown, isFinale, isDecrypting])

  // Round 2 is one-click-per-team from the admin table — never auto-play 20→1.

  // Current spotlight team during countdown
  // For Round 2 (20 -> 1): Step 1 reveals rank 20, Step 20 reveals rank 1
  // For Round 3 (5 -> 1): Step 1 reveals rank 5, Step 5 reveals rank 1
  const currentSpotlightRank = isFinale ? (FINALE_CUTOFF + 1 - revealedStep) : (21 - revealedStep)
  const finaleRoster = top5.length > 0 ? top5 : top5Ref.current

  const qualifierRoster = (
    advancing.length > 0
      ? advancing
      : advancingRef.current.length > 0
        ? advancingRef.current
        : [...rawDisplay]
            .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
            .slice(0, ROUND2_CUTOFF)
            .map((e, idx) => ({ ...e, rank: idx + 1 }))
  )

  // Keep a stable finale roster even if a later fetch returns no rows.
  const currentSpotlightTeam = revealedStep > 0
    ? (isFinale
      ? (finaleRoster[FINALE_CUTOFF - revealedStep] || finaleRoster[finaleRoster.length - 1] || null)
      : (qualifierRoster[20 - revealedStep] || qualifierRoster[qualifierRoster.length - 1] || null))
    : null
  const qualifierCount = Math.min(20, qualifierRoster.length || 20)
  const allPlacesAnnounced = !isDecrypting && (
    isFinale
      ? revealedStep >= FINALE_CUTOFF
      : (revealedStep >= 20 || unlockedRanks.length >= 20)
  )
  // Keep the #1 card full-size for the 15s hold; compact only after we scroll to the table.
  const ceremonySettled = allPlacesAnnounced && rosterShown

  // Single-column luxury row grid matching Stage 1 Leaderboard
  const QUALIFIER_GRID = 'grid grid-cols-[64px_minmax(0,1fr)_170px_110px_120px] px-6 py-3.5 items-center min-h-[56px]'

  const renderQualifierRow = (rankNum: number) => {
    if (rankNum > qualifierCount) return null

    const team = qualifierRoster[rankNum - 1]
    const isRevealed = unlockedRanks.includes(rankNum) || revealedStep >= (21 - rankNum)
    const isSpotlight = rankNum === currentSpotlightRank && revealedStep > 0

    if (!isRevealed || !team) {
      return (
        <div
          key={`slot-locked-${rankNum}`}
          ref={(el) => { rowRefs.current[rankNum] = el }}
          className={`${QUALIFIER_GRID} border-b border-black/[0.04] bg-[#EBE3D5]/40 text-slate-400 opacity-60`}
        >
          <div className="flex items-center justify-center">
            <span className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center font-black text-xs text-slate-400">
              #{rankNum}
            </span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <Lock size={13} className="animate-pulse text-slate-400 shrink-0" />
            <span className="text-xs font-semibold tracking-wide truncate">Locked & Pending Announcement...</span>
          </div>
          <div><div className="w-20 h-5 rounded bg-black/5 animate-pulse" /></div>
          <div className="text-center"><span className="text-xs font-mono text-slate-300">--</span></div>
          <div className="text-right"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending</span></div>
        </div>
      )
    }

    const trackKey = typeof team.track === 'string' ? team.track : ''
    const track = getTrackConfig(trackKey)

    return (
      <div
        key={`slot-revealed-${rankNum}-${team.teamId}`}
        id={`r2-row-${rankNum}`}
        ref={(el) => { rowRefs.current[rankNum] = el }}
        className={`${QUALIFIER_GRID} border-b transition-colors ${
          isSpotlight
            ? 'bg-[#E83C00]/15 border-[#E83C00]/40 shadow-md ring-1 ring-[#E83C00]/30'
            : rankNum === 1
            ? 'bg-orange-500/5 hover:bg-orange-500/10 border-black/5'
            : 'bg-[#F4ECE1] hover:bg-white/60 border-black/5'
        }`}
      >
        <div className="flex items-center justify-center">
          {rankNum === 1 ? (
            <span className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-sm bg-[#E83C00] text-white ring-2 ring-[#E83C00]/30 gap-0.5">
              <Crown size={11} className="text-amber-200 fill-amber-200/20 stroke-[2.5]" />
              1
            </span>
          ) : rankNum === 2 ? (
            <span className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-sm bg-slate-300 text-slate-900 ring-1 ring-slate-400/40 gap-0.5">
              <Medal size={11} className="text-slate-700 stroke-[2.5]" />
              2
            </span>
          ) : rankNum === 3 ? (
            <span className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-sm bg-amber-200 text-amber-900 ring-1 ring-amber-400/40 gap-0.5">
              <Award size={11} className="text-amber-800 stroke-[2.5]" />
              3
            </span>
          ) : (
            <span className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
              #{rankNum}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={team.teamName} size="xs" className="shrink-0 ring-1 ring-white shadow-xs" />
          <div className="min-w-0 leading-tight">
            <div className="font-bold truncate text-slate-900 text-sm">{team.teamName}</div>
            <div className="text-xs text-slate-400 truncate">{team.college}</div>
          </div>
        </div>

        <div className="min-w-0">
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold border bg-white truncate max-w-full"
            style={{ color: track.color, borderColor: `${track.color}30` }}
          >
            {track.label}
          </span>
        </div>

        <div className="text-center font-mono font-black text-sm text-[#1A1A1A]">
          {Number(team.totalScore || 0).toFixed(1)}
        </div>

        <div className="text-right">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wide">
            <CheckCircle2 size={11} className="text-emerald-600 stroke-[2.5]" />
            Qualified
          </span>
        </div>
      </div>
    )
  }


  return (
    <div className="h-screen flex flex-col relative overflow-hidden" style={{
      backgroundColor: isFinale && revealedStep > 0 ? '#070605' : '#EBE3D5',
      fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
      color: isFinale && revealedStep > 0 ? '#F5F5F5' : '#1A1A1A',
      transition: 'background-color 700ms ease, color 700ms ease',
    }}>

      {/* ── Top Bar ── hidden during Top 5 announcement so the stage is full-bleed */}
      {!(isFinale && revealedStep > 0) && (
      <div className="shrink-0 z-30 flex items-center justify-between px-6 sm:px-10 py-4 border-b backdrop-blur-md bg-[#EBE3D5]/90 border-black/5 text-[#1A1A1A]">
        <div className="flex items-end gap-4 sm:gap-6">
          <div className="flex items-end gap-2">
            <SnapServeMark className="h-[24.32px] w-[24.32px] shrink-0 object-contain translate-y-[5px]" />
            <span
              className="text-[19.456px] leading-none tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', 'Montserrat', system-ui, sans-serif" }}
            >
              <span style={{ fontWeight: 800, color: '#0A0A0A' }}>Snap</span>
              <span style={{ fontWeight: 800, color: '#6F6F6F' }}>Serve</span>
            </span>
          </div>
          <span className="opacity-20 text-lg font-light leading-none pb-[1px]" aria-hidden>|</span>
          <VobizLockup className="h-[24.32px] w-auto drop-shadow-sm" />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 shadow-xs">
            <Flame size={13} className="text-orange-500 fill-orange-500/20" />
            <span className="text-[11px] font-black text-[#E83C00] tracking-widest uppercase">Live</span>
          </div>

          <span className="font-mono text-base sm:text-lg font-bold tracking-wider text-slate-600">
            {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 🎭 DRAMATIC GRAND REVEAL CEREMONY (Round 2: 20➔1 | Round 3: 5➔1)      */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {isRevealing ? (
        <div ref={scrollContainerRef} className={`relative flex-1 min-h-0 h-0 w-full transition-colors duration-700 ${
          isFinale && revealedStep > 0
            ? 'overflow-hidden bg-[#070605] px-0 pb-0'
            : 'overflow-y-auto px-4 sm:px-8 pb-10'
        }`}>
          
          {!rosterShown && (
          <div className={`w-full flex flex-col items-stretch shrink-0 ${
            isFinale && revealedStep > 0
              ? 'h-full min-h-0 py-0'
              : 'min-h-full items-center justify-start pt-4 sm:pt-6 pb-8'
          }`}>
            {/* Header */}
            {!(isFinale && revealedStep > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center flex flex-col items-center gap-4 sm:gap-5 mb-10 sm:mb-14"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full shadow-xl bg-white/90 border border-amber-500/30 text-amber-950 shadow-amber-900/5 ring-1 ring-amber-500/10 backdrop-blur-md">
                {isFinale ? <Crown size={13} className="text-amber-500 fill-amber-500/40" /> : <Trophy size={13} className="text-amber-500" />}
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.16em]">
                  {isFinale ? '👑 Grand Finale · Champions Coronation' : '⚡ Stage 1 Qualifiers · Live Ceremony'}
                </span>
              </div>
              {!ceremonySettled && (
                <>
                  <div className="flex items-center justify-center gap-3">
                    <span className="h-px w-10 sm:w-12 bg-gradient-to-r from-transparent to-[#E83C00]/40" />
                    <h2 className="text-[#E83C00] font-black tracking-[0.28em] uppercase text-xs">
                      AI குரல் · VOICE FOR TAMIL NADU · 2026
                    </h2>
                    <span className="h-px w-10 sm:w-12 bg-gradient-to-l from-transparent to-[#E83C00]/40" />
                  </div>
                  <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] pb-1">
                    {isFinale ? (
                      <span className="inline-flex items-center gap-3 flex-wrap justify-center">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E83C00] via-amber-600 to-[#E83C00] drop-shadow-xs">
                          Grand Finale
                        </span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#111111] via-[#2A241E] to-[#0A0A0A]">
                          Winners
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-3 flex-wrap justify-center">
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#111111] via-[#2A241E] to-[#0A0A0A]">
                          Meet The
                        </span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E83C00] via-amber-600 to-[#E83C00] drop-shadow-xs">
                          Top 20
                        </span>
                      </span>
                    )}
                  </h1>
                </>
              )}
            </motion.div>
            )}

            {/* 🌟 HERO SPOTLIGHT ANNOUNCEMENT CARD — 75% width for 24x10 LED */}
            <div className={`${
              isFinale
                ? revealedStep === 0
                  ? 'w-[88%] max-w-7xl mx-auto flex flex-col items-center'
                  : 'h-full min-h-0 w-full'
                : 'w-3/4 mx-auto flex flex-col items-center'
            }`}>
              {isFinale && revealedStep > 0 ? (
                <div className="h-full w-full min-h-0">
                  <GrandFinaleExperience
                    finalists={finaleRoster}
                    revealStep={revealedStep}
                    isAnimating={isDecrypting}
                    stepStartedAt={finaleStepStartedAt}
                    stepDurationMs={nameSpinMs}
                  />
                </div>
              ) : (
                <PremiumRevealCard
                  isFinale={isFinale}
                  currentSpotlightRank={currentSpotlightRank}
                  currentSpotlightTeam={currentSpotlightTeam}
                  revealedStep={revealedStep}
                  maxSteps={maxSteps}
                  isDecrypting={isDecrypting}
                  decryptingRank={decryptingRank}
                  revealingTeamName={revealingTeamName}
                  nameSpinMs={nameSpinMs}
                  settled={false}
                />
              )}
            </div>
          </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* BOTTOM VIEW: Top 20 Table (for Round 2) OR 3D Podium (for Round 3) */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {isFinale && !isDecrypting && (
            /* ROUND 3: WINNERS PODIUM — hidden during the countdown card */
            <div ref={rosterRef} className="hidden w-full max-w-5xl mx-auto flex-col items-center mt-32 pb-32 shrink-0">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/5 text-slate-700 mb-6 shadow-sm">
                <Trophy size={14} className="text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Official Stage 3 Podium · Top 5 Grand Finale Winners
                </span>
              </div>

              <div className="flex items-end justify-center gap-2 sm:gap-3 w-full max-w-6xl">
                {finalePodiumOrder.map((entry, idx) => {
                  if (!entry) return null
                  const isFirst = entry.rank === 1
                  const heights: Record<number, string> = { 1: 'min-h-[400px] sm:min-h-[430px]', 2: 'min-h-[330px] sm:min-h-[360px]', 3: 'min-h-[290px] sm:min-h-[320px]', 4: 'min-h-[240px] sm:min-h-[260px]', 5: 'min-h-[220px] sm:min-h-[240px]' }
                  const compact = entry.rank >= 4
                  const cardStyles: Record<number, { bg: string; border: string; badge: string; shadow: string }> = {
                    1: { bg: '#F4ECE1', border: '#E83C00', badge: 'bg-[#E83C00] text-white', shadow: 'shadow-2xl shadow-orange-900/30 ring-4 ring-amber-400/60' },
                    2: { bg: '#F4ECE1', border: '#475569', badge: 'bg-slate-700 text-white', shadow: 'shadow-xl shadow-black/10 ring-2 ring-slate-400/40' },
                    3: { bg: '#F4ECE1', border: '#B45309', badge: 'bg-amber-800 text-white', shadow: 'shadow-xl shadow-black/10 ring-2 ring-amber-600/40' },
                    4: { bg: '#F4ECE1', border: '#64748B', badge: 'bg-slate-600 text-white', shadow: 'shadow-lg shadow-black/10 ring-1 ring-slate-400/30' },
                    5: { bg: '#F4ECE1', border: '#78716C', badge: 'bg-stone-600 text-white', shadow: 'shadow-lg shadow-black/10 ring-1 ring-stone-400/30' },
                  }
                  const style = cardStyles[entry.rank]
                  const place = finalePlace(entry.rank)
                  // Step 1 reveals #5, Step 5 reveals #1
                  const isUnlocked = revealedStep >= (FINALE_CUTOFF + 1 - entry.rank)

                  if (!isUnlocked) {
                    const isNextToUnlock = revealedStep === (FINALE_CUTOFF - entry.rank)
                    const isCurrentlyDecrypting = isDecrypting && entry.rank === decryptingRank

                    return (
                      <motion.div
                        key={`podium-locked-${entry.rank}`}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ 
                          opacity: 1, 
                          scale: isCurrentlyDecrypting ? [1, 1.05, 1] : isNextToUnlock && isFirst ? [1, 1.03, 1] : 1 
                        }}
                        transition={{ 
                          repeat: isCurrentlyDecrypting || (isNextToUnlock && isFirst) ? Infinity : 0, 
                          duration: isCurrentlyDecrypting ? 0.7 : 1.8 
                        }}
                        className={`relative flex flex-col items-center justify-between p-4 sm:p-6 rounded-[2rem] flex-1 min-w-0 max-w-[210px] ${heights[entry.rank]} shadow-2xl overflow-hidden border-2 transition-all`}
                        style={{
                          background: isCurrentlyDecrypting
                            ? 'linear-gradient(180deg, #3d1b0a 0%, #170a04 100%)'
                            : isFirst
                            ? 'linear-gradient(180deg, #2A1408 0%, #120904 100%)'
                            : entry.rank === 2
                            ? 'linear-gradient(180deg, #18181B 0%, #09090B 100%)'
                            : 'linear-gradient(180deg, #1F1B16 0%, #0F0D0B 100%)',
                          borderColor: isCurrentlyDecrypting
                            ? '#F59E0B'
                            : isFirst 
                            ? (isNextToUnlock ? '#F59E0B' : 'rgba(232, 60, 0, 0.5)')
                            : entry.rank === 2 
                            ? 'rgba(148, 163, 184, 0.3)' 
                            : 'rgba(217, 119, 6, 0.3)',
                          boxShadow: isCurrentlyDecrypting 
                            ? '0 0 50px rgba(245, 158, 11, 0.6), 0 0 20px rgba(232, 60, 0, 0.4)' 
                            : isFirst && isNextToUnlock 
                            ? '0 0 40px rgba(245, 158, 11, 0.4)' 
                            : undefined
                        }}
                      >
                        {/* Shimmering Animated Background Ring */}
                        <div className="absolute inset-0 bg-radial from-amber-500/10 to-transparent pointer-events-none" />

                        {/* Top Locked Badge */}
                        <div className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-2xl flex items-center gap-1.5 justify-center font-black text-[11px] sm:text-xs shadow-xl ${
                          isCurrentlyDecrypting
                            ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-400/50 font-black animate-pulse'
                            : isFirst 
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/50 ring-2 ring-amber-500/30' 
                            : entry.rank === 2 
                            ? 'bg-slate-900/90 text-slate-300 border border-slate-600/40' 
                            : 'bg-amber-950/70 text-amber-400 border border-amber-700/40'
                        }`}>
                          <Lock size={12} className={isCurrentlyDecrypting ? 'text-slate-950 animate-spin' : 'text-amber-400 animate-pulse'} />
                          <span>
                            {isCurrentlyDecrypting
                              ? `⚡ UNSEALING #${entry.rank} ⚡`
                              : isFirst
                              ? '👑 1st Place Champion'
                              : place.locked}
                          </span>
                        </div>

                        {/* Center Mystery Shield with Pulsing Mystery Icon */}
                        <div className="my-auto flex flex-col items-center text-center">
                          <div className={`w-14 h-14 sm:w-18 sm:h-18 rounded-3xl flex items-center justify-center mb-3 shadow-inner relative ${
                            isCurrentlyDecrypting ? 'bg-amber-500/20 border-2 border-amber-400 ring-4 ring-amber-400/30' : 'bg-white/5 border border-white/10'
                          }`}>
                            {isFirst ? (
                              <Crown size={28} className={isCurrentlyDecrypting ? 'text-amber-300 animate-bounce' : 'text-amber-400 animate-bounce'} />
                            ) : (
                              <Lock size={26} className={isCurrentlyDecrypting ? 'text-amber-300 animate-bounce' : 'text-amber-400/80 animate-pulse'} />
                            )}
                            <div className="absolute inset-0 rounded-3xl border border-amber-500/40 animate-ping opacity-40" />
                          </div>
                          <span className="text-xs sm:text-sm font-black text-white/90 tracking-wider">
                            {isFirst ? '👑 GRAND CHAMPION' : place.title.toUpperCase()}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isCurrentlyDecrypting ? 'text-amber-300 animate-bounce' : 'text-amber-400 animate-pulse'}`}>
                            {isCurrentlyDecrypting ? '⚡ REVEALING NAME ⚡' : isNextToUnlock ? '⚡ Next To Crown ⚡' : '🔒 Awaiting Reveal...'}
                          </span>
                        </div>

                        {/* Bottom Mystery Score */}
                        <div className="w-full pt-4 border-t border-white/10 text-center">
                          <span className={`text-xl sm:text-2xl font-mono font-black tracking-widest ${isCurrentlyDecrypting ? 'text-amber-300 animate-pulse' : 'text-white/40'}`}>
                            {isCurrentlyDecrypting ? '??.?' : '??.?'}
                          </span>
                          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">Final Score</p>
                        </div>
                      </motion.div>
                    )
                  }

                  return (
                    <motion.div
                      key={`podium-${entry.teamId}`}
                      layout
                      initial={{ opacity: 0, scale: 0.8, y: 40 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
                      className={`relative flex flex-col items-center p-4 sm:p-6 rounded-[2rem] flex-1 min-w-0 max-w-[210px] ${heights[entry.rank]} ${style?.shadow ?? ''} transition-all`}
                      style={{
                        backgroundColor: style?.bg,
                        border: isFirst ? '3px solid #E83C00' : `2px solid ${style?.border ?? '#64748B'}`,
                        boxShadow: isFirst
                          ? '0 25px 60px -12px rgba(232, 60, 0, 0.4), 0 0 35px rgba(245, 158, 11, 0.35)'
                          : undefined
                      }}
                    >
                      {/* Top Badge */}
                      <div className={`absolute -top-6 px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl flex items-center gap-1.5 justify-center font-black text-sm sm:text-base shadow-xl ${style?.badge ?? 'bg-slate-600 text-white'}`}>
                        {isFirst ? (
                          <>
                            <Crown size={18} className="text-amber-300 fill-amber-300 stroke-[2.5] animate-bounce" />
                            <span>👑 Grand Champion</span>
                          </>
                        ) : (
                          <>
                            <Medal size={16} className="text-slate-200 stroke-[2.5]" />
                            <span>{place.title}</span>
                          </>
                        )}
                      </div>

                      {/* Avatar & Team Info */}
                      <div className={`${compact ? 'mt-6 sm:mt-7' : 'mt-7 sm:mt-9'} flex flex-col items-center text-center flex-1 w-full min-w-0`}>
                        <div className="relative">
                          <Avatar name={entry.teamName} size={compact ? 'md' : 'lg'} className={`${compact ? 'mb-2' : 'mb-3'} shadow-lg ring-4 ${isFirst ? 'ring-[#E83C00] shadow-orange-500/40' : entry.rank === 2 ? 'ring-slate-400 shadow-slate-500/20' : 'ring-amber-600 shadow-amber-600/20'}`} />
                          {isFirst && (
                            <div className="absolute -top-3 -right-2 bg-amber-400 text-slate-900 rounded-full p-1 shadow-md animate-bounce">
                              <Crown size={14} className="fill-slate-900" />
                            </div>
                          )}
                        </div>
                        <h3 className={`${compact ? 'text-sm sm:text-base' : 'text-lg sm:text-2xl'} font-black text-[#1A1A1A] mb-1 truncate w-full`}>{entry.teamName}</h3>
                        <p className={`text-slate-500 font-medium ${compact ? 'text-[11px]' : 'text-xs sm:text-sm'} truncate w-full`}>{entry.college}</p>
                        <div className={compact ? 'mt-1.5' : 'mt-2'}>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-800 border border-black/10 shadow-xs">
                            {getTrackConfig(entry.track).label}
                          </span>
                        </div>
                      </div>

                      {/* Final Score */}
                      <div className={`w-full ${compact ? 'pt-3' : 'pt-4'} mt-auto border-t border-black/10 text-center`}>
                        <motion.div key={entry.totalScore} initial={{ scale: 1.25 }} animate={{ scale: 1 }}
                          className={`${compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'} font-black font-mono ${isFirst ? 'text-[#E83C00]' : 'text-[#1A1A1A]'}`}>
                          {entry.totalScore.toFixed(1)}
                        </motion.div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">Final Score</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
          {!isFinale && rosterShown && (
            /* ROUND 2: TOP 20 QUALIFIERS TABLE — hidden until #1 has been held 15s */
            <div ref={rosterRef} className="w-full max-w-6xl mx-auto rounded-[2rem] overflow-hidden shadow-2xl shadow-black/10 border border-black/5 bg-[#F4ECE1] mb-16 pb-4 shrink-0 mt-4">
              {/* Header with Title & Status Counter */}
              <div className="flex items-center justify-between px-6 py-4 bg-[#F4ECE1] border-b border-black/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                    <Trophy size={16} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[#1A1A1A] leading-tight">Round 2 · Top 20 Qualifiers Leaderboard</h3>
                    <p className="text-xs text-slate-500 font-medium">Official Qualified Teams Advancing to Round 2</p>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-800 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 shadow-sm font-mono">
                  {unlockedRanks.length} / {qualifierCount} Unlocked
                </span>
              </div>

              {/* Table Column Headers */}
              <div className={`${QUALIFIER_GRID} bg-[#1A1A1A] text-[10px] font-bold text-white/70 uppercase tracking-widest`}>
                <div className="text-center">Rank</div>
                <div>Team &amp; College</div>
                <div>Track</div>
                <div className="text-center">Score</div>
                <div className="text-right">Status</div>
              </div>

              {/* Rows 1 to 20 Single Column Layout (matching Stage 1 Leaderboard) */}
              <div className="flex flex-col">
                {Array.from({ length: qualifierCount }).map((_, i) => renderQualifierRow(i + 1))}
              </div>
            </div>
          )}
        </div>


      ) : (
        /* ════════════════════════════════════════════════════════════════════ */
        /* STANDARD STAGE 1 / 2 / 3 LEADERBOARDS                                */
        /* ════════════════════════════════════════════════════════════════════ */
        <div className="relative z-10 flex-1 min-h-0 flex flex-col items-center w-full overflow-hidden">

          {/* 📌 FIXED HEADER SECTION (Title + Subtitle + Fixed Table Column Headers) */}
          <div className="shrink-0 z-20 w-full backdrop-blur-md bg-[#EBE3D5] pt-5 pb-0 flex flex-col items-center">
            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeRound}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center"
                >
                  {/* Luxury Pill Badge */}
                  <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-amber-500/30 text-amber-900 mb-2 shadow-lg shadow-amber-900/5 ring-1 ring-amber-500/10">
                    <Trophy size={13} className="text-amber-500" />
                    <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-800">
                      {activeRound === 3 ? '👑 Grand Finale · Champions Podium' : activeRound === 2 ? '⚡ Stage 2 · Top 20 Shortlist' : '🎯 Stage 1 - Live Judging'}
                    </span>
                  </div>

                  {/* Tamil Brand Tag with Decorative Hairline Accents */}
                  <div className="flex items-center justify-center gap-3 mb-1">
                    <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#E83C00]/40" />
                    <h2 className="text-[#E83C00] font-black tracking-[0.28em] uppercase text-xs">
                      AI குரல் · VOICE FOR TAMIL NADU · 2026
                    </h2>
                    <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#E83C00]/40" />
                  </div>

                  {/* Ultra-Premium Dual-Tone Typography Title */}
                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none mb-2">
                    {activeRound === 3 ? (
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A0A02] via-[#E83C00] to-[#B45309] drop-shadow-sm">
                        Top 5 Grand Finale Winners
                      </span>
                    ) : activeRound === 2 ? (
                      <span className="inline-flex items-center gap-3 flex-wrap justify-center">
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#111111] via-[#2A241E] to-[#0A0A0A]">
                          Round 2
                        </span>
                        <span className="text-amber-500 font-light opacity-50 text-2xl sm:text-4xl">·</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E83C00] via-amber-600 to-[#E83C00] drop-shadow-xs font-black">
                          Top 20
                        </span>
                      </span>
                    ) : (
                      <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#111111] via-[#2A241E] to-[#0A0A0A]">
                        Live Evaluation Status
                      </span>
                    )}
                  </h1>

                  {/* Refined Subtitle Pill */}
                  <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-black/[0.03] border border-black/5 text-xs text-slate-600 font-semibold tracking-wide mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>
                      {activeRound === 3
                        ? `${filtered.length} finalists competing for the crown`
                        : activeRound === 2
                        ? (r3Teams.length > 0
                          ? `${advancing.length} shortlisted teams · official selection`
                          : `${filtered.length} teams competing · judges scoring live`)
                        : `${filtered.length} teams · live evaluation in progress`}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* 🖤 PERMANENTLY FIXED TABLE COLUMN HEADER (ROUND 1) */}
              {activeRound === 1 && (
                <div className="w-full grid grid-cols-[56px_1fr_170px_110px_110px] px-6 py-3.5 bg-[#1A1A1A] text-[10px] font-bold text-white/75 uppercase tracking-widest border-b border-white/10 shadow-lg rounded-t-[2rem]">
                  <div className="text-center">#</div>
                  <div>Team</div>
                  <div>Track</div>
                  <div className="text-center">Evaluation</div>
                  <div className="text-right">Status</div>
                </div>
              )}

              {/* 🖤 PERMANENTLY FIXED TABLE COLUMN HEADER (ROUND 2) */}
              {activeRound === 2 && (
                r3Teams.length > 0 ? (
                  <div className="w-full max-w-5xl mx-auto grid grid-cols-[1fr_200px] px-8 py-3.5 bg-[#1A1A1A] text-white/75 border-b border-white/10 text-xs font-bold uppercase tracking-widest shadow-lg rounded-t-[2rem]">
                    <div>Team</div>
                    <div>Track</div>
                  </div>
                ) : (
                  <div className="w-full max-w-5xl mx-auto grid grid-cols-[80px_1fr_200px_120px_120px_80px] px-8 py-3.5 bg-[#1A1A1A] text-white/75 border-b border-white/10 text-xs font-bold uppercase tracking-widest shadow-lg rounded-t-[2rem]">
                    <div className="text-center">Rank</div>
                    <div>Team Details</div>
                    <div>Track</div>
                    <div className="text-center">Judges</div>
                    <div className="text-right">Score</div>
                    <div className="text-right">Change</div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* 📜 SCROLLABLE CONTENT AREA (Rows start immediately below the header and match exact width) */}
          <div ref={scrollContainerRef} className="flex-1 min-h-0 w-full overflow-y-auto flex flex-col items-center pb-24 [scrollbar-gutter:stable]">
            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center">

            {/* ROUND 1 VIEW — Scrollable Rows */}
            {activeRound === 1 && (
              <div className="w-full shadow-2xl shadow-black/10 border border-t-0 border-black/5 bg-[#F4ECE1] rounded-b-[2rem] overflow-hidden">
                <div className="flex flex-col">
                  <AnimatePresence>
                    {filtered.map((entry, idx) => (
                      <Round1Row key={entry.teamId} entry={entry} index={idx} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* ROUND 2 VIEW — Scrollable Rows */}
            {activeRound === 2 && (
              <div className="w-full max-w-5xl mx-auto rounded-b-[2rem] bg-[#F4ECE1] shadow-2xl shadow-black/10 border border-t-0 border-black/5 overflow-hidden">
                {r3Teams.length > 0 ? (
                  <div className="flex flex-col bg-[#F4ECE1]">
                    <AnimatePresence>
                      {[...advancing]
                        .sort((a, b) => a.teamName.localeCompare(b.teamName))
                        .map((entry) => (
                          <Round2Row key={entry.teamId} entry={entry} hideStandings />
                        ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex flex-col bg-[#F4ECE1]">
                    <AnimatePresence>
                      {advancing.map((entry) => (
                        <Round2Row key={entry.teamId} entry={entry} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

          {/* ROUND 3 — Winners podium only (locked until admin reveal step) */}
          {activeRound === 3 && (
            <div className="flex items-end justify-center gap-3 w-full max-w-6xl mt-4">
              {finalePodiumOrder.map((entry, idx) => {
                if (!entry) return null
                const isFirst = entry.rank === 1
                const heights: Record<number, string> = { 1: 'min-h-[380px]', 2: 'min-h-[320px]', 3: 'min-h-[280px]', 4: 'min-h-[240px]', 5: 'min-h-[220px]' }
                const compact = entry.rank >= 4
                const cardStyles: Record<number, { bg: string; border: string; badge: string; shadow: string }> = {
                  1: { bg: '#F4ECE1', border: '#E83C00', badge: 'bg-[#E83C00] text-white', shadow: 'shadow-2xl shadow-orange-900/20' },
                  2: { bg: '#F4ECE1', border: 'transparent', badge: 'bg-slate-200 text-slate-700', shadow: 'shadow-xl shadow-black/5' },
                  3: { bg: '#F4ECE1', border: 'transparent', badge: 'bg-amber-100 text-amber-800', shadow: 'shadow-xl shadow-black/5' },
                  4: { bg: '#F4ECE1', border: 'transparent', badge: 'bg-slate-100 text-slate-600', shadow: 'shadow-lg shadow-black/5' },
                  5: { bg: '#F4ECE1', border: 'transparent', badge: 'bg-stone-100 text-stone-600', shadow: 'shadow-lg shadow-black/5' },
                }
                const style = cardStyles[entry.rank]
                const place = finalePlace(entry.rank)
                const isUnlocked = revealedStep >= (FINALE_CUTOFF + 1 - entry.rank)
                if (!isUnlocked) {
                  return (
                    <div
                      key={`locked-${entry.rank}`}
                      className={`relative flex flex-col items-center justify-between p-6 rounded-[2rem] flex-1 min-w-0 max-w-[210px] ${heights[entry.rank]} shadow-xl border-2 overflow-hidden`}
                      style={{
                        background: isFirst ? 'linear-gradient(180deg, #2A1408 0%, #120904 100%)' : 'linear-gradient(180deg, #1F1B16 0%, #0F0D0B 100%)',
                        borderColor: isFirst ? 'rgba(232, 60, 0, 0.5)' : 'rgba(148, 163, 184, 0.25)',
                      }}
                    >
                      <div className="px-4 py-2 rounded-2xl bg-amber-950 text-amber-300 border border-amber-500/40 text-xs font-black flex items-center gap-1.5">
                        <Lock size={12} className="animate-pulse" />
                        {place.locked}
                      </div>
                      <div className="my-auto flex flex-col items-center">
                        {isFirst ? <Crown size={28} className="text-amber-400 animate-bounce mb-2" /> : <Lock size={24} className="text-amber-400/80 mb-2" />}
                        <span className="text-xs font-black text-white/90 tracking-wider">{place.title.toUpperCase()}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest mt-1 text-amber-400">🔒 Awaiting admin reveal</span>
                      </div>
                      <div className="w-full pt-4 border-t border-white/10 text-center">
                        <span className="text-2xl font-mono font-black text-white/40 tracking-widest">??.?</span>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">Final Score</p>
                      </div>
                    </div>
                  )
                }
                return (
                  <motion.div
                    key={entry.teamId}
                    layout
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.12, duration: 0.7, type: 'spring', bounce: 0.35 }}
                    className={`relative flex flex-col items-center p-6 rounded-[2rem] flex-1 min-w-0 max-w-[210px] ${heights[entry.rank]} ${style?.shadow ?? ''}`}
                    style={{ backgroundColor: style?.bg, border: `2px solid ${style?.border}` }}
                  >
                    <div className={`absolute -top-6 px-4 py-2 rounded-2xl flex items-center gap-1.5 justify-center font-black text-sm shadow-xl ${style?.badge}`}>
                      {isFirst ? (
                        <>
                          <Crown size={18} className="text-amber-300 fill-amber-300/30 stroke-[2.5]" />
                          <span>Grand Champion</span>
                        </>
                      ) : (
                        <span>{place.title}</span>
                      )}
                    </div>
                    <div className={`${compact ? 'mt-6' : 'mt-8'} flex flex-col items-center text-center flex-1 w-full`}>
                      <Avatar name={entry.teamName} size={compact ? 'md' : 'lg'} className={`${compact ? 'mb-2.5' : 'mb-4'} shadow-lg ring-4 ${isFirst ? 'ring-orange-200' : 'ring-white/60'}`} />
                      <h3 className={`${compact ? 'text-sm' : 'text-xl'} font-black text-[#1A1A1A] mb-1 truncate w-full`}>{entry.teamName}</h3>
                      <p className={`text-slate-500 font-medium ${compact ? 'text-[11px]' : 'text-xs'} truncate w-full`}>{entry.college}</p>
                    </div>
                    <div className={`w-full ${compact ? 'pt-3' : 'pt-4'} mt-auto border-t border-black/5 text-center`}>
                      <motion.div key={entry.totalScore} initial={{ scale: 1.2 }} animate={{ scale: 1 }}
                        className={`${compact ? 'text-2xl' : 'text-3xl'} font-black text-[#1A1A1A]`}>
                        {entry.totalScore.toFixed(1)}
                      </motion.div>
                      <p className="text-slate-400 text-[10px] mt-1 font-medium">Final Score</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeaderboardPage
