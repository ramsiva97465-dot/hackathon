import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { SnapServeMark, VobizLockup } from '@/components/brand/BrandLogos'
import { WinnerLetterReels } from '@/components/reveal/WinnerLetterReels'
import { Avatar } from '@/components/ui/Avatar'
import { getTrackConfig } from '@/lib/utils'
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

const COUNTDOWN_WORDS: Record<number, string> = {
  10: 'Ten', 9: 'Nine', 8: 'Eight', 7: 'Seven', 6: 'Six',
  5: 'Five', 4: 'Four', 3: 'Three', 2: 'Two', 1: 'One', 0: 'Zero',
}

const ROUND2_COUNTDOWN_START = 5

/** Step 1=5th, 2=4th, 3=2nd runner-up, 4=1st runner-up, 5=champion */
function finaleCountdownStart(step: number) {
  if (step === 1 || step === 2) return 3
  if (step === 3) return 5
  if (step === 4) return 7
  return 10
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
  const [countdownNum, setCountdownNum] = useState<number | null>(null)
  const [scrambledName, setScrambledName] = useState<string>('')
  const [decryptingRank, setDecryptingRank] = useState<number | null>(null)
  const [revealingTeamName, setRevealingTeamName] = useState('')
  const [unlockedRanks, setUnlockedRanks] = useState<number[]>([])
  const unlockedRanksRef = useRef<number[]>([])
  const rosterRef = useRef<HTMLDivElement>(null)
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

  useWebSocket<{ step: number; round?: number }>('leaderboard:reveal_step', (data) => {
    if (typeof data?.step !== 'number') return
    const targetRound = data.round || 3
    if (targetRound !== revealRoundRef.current || !isRevealingRef.current) {
      setRevealRound(targetRound)
      // Keep fetching the Top 20 payload (includes finalists). A round-3
      // query can come back empty and wipe the winner card after countdown.
      setActiveRound(targetRound === 3 ? 2 : targetRound)
      setIsRevealing(true)
    }
    executeRevealToStep(data.step, targetRound)
  })

  useWebSocket<{ isRevealing: boolean }>('leaderboard:reveal_stop', () => {
    if (isRevealingRef.current) stopGrandReveal(true)
  })

  useWebSocket<{ isRevealing: boolean; round?: number; step?: number }>('leaderboard:reveal_state', (data) => {
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

  const applyServerRevealState = (
    data: { isRevealing?: boolean; round?: number; step?: number } | undefined,
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
        executeRevealToStep(serverStep, targetRound)
      }
      return
    }

    // A leftover step-0 poll (ceremony opened but no place clicked yet)
    // must never rewind a place the LCD already unsealed.
    if (serverStep > revealedStepRef.current) {
      executeRevealToStep(serverStep, targetRound, { catchUp: source === 'poll' })
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

  // TV Mode Auto-scroll logic
  useEffect(() => {
    const waitingForFinale = entries.some((e) => ((e as any).round || 1) === 3)
    if (isRevealing) return
    if (!tvMode && !waitingForFinale) return
    const scrollSpeed = 1
    let scrollingUp = false
    const interval = setInterval(() => {
      if (scrollingUp) return

      window.scrollBy({ top: scrollSpeed, left: 0, behavior: 'auto' })
      
      if ((window.innerHeight + Math.ceil(window.scrollY)) >= document.body.offsetHeight - 50) {
        scrollingUp = true
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setTimeout(() => { scrollingUp = false }, 2000)
      }
    }, 50)
    return () => clearInterval(interval)
  }, [tvMode, isRevealing, entries])

  const rawDisplay = entries

  // ── Round-based filtering ──────────────────────────────────────────────────
  const filtered = rawDisplay
    .filter(e => {
      const teamRound = (e as any).round || 1
      if (activeRound === 3) return teamRound === 3
      if (activeRound === 2) return teamRound >= 2
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const stopGrandReveal = (keepFinaleStep = false) => {
    const wasRevealing = isRevealingRef.current
    const leavingRound = revealRoundRef.current
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
    animatingStepRef.current = 0
    isDecryptingRef.current = false
    revealedStepRef.current = 0
    setRevealedStep(0)
    setIsDecrypting(false)
    setCountdownNum(null)
    setUnlockedRanks([])
    setRevealingTeamName('')
  }

  const executeRevealToStep = (
    requestedStep: number,
    targetRound?: number,
    options?: { catchUp?: boolean },
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

    // A late-joining screen (or poll) should land on the current place
    // without replaying every earlier countdown.
    if (options?.catchUp) {
      revealedStepRef.current = requestedStep
      setRevealedStep(requestedStep)
      setIsDecrypting(false)
      setCountdownNum(null)
      if (!isFinaleStep && requestedStep > 0) {
        const recovered = Array.from({ length: requestedStep }, (_, i) => 21 - (i + 1))
        unlockedRanksRef.current = recovered
        setUnlockedRanks(recovered)
      }
      return
    }

    // Both ceremonies unseal exactly the next place: Top 20 is 20→1, finale is 5→1.
    const targetStep = Math.min(requestedStep, revealedStepRef.current + 1, lastStep)

    const currentRank = isFinaleStep ? (FINALE_CUTOFF + 1 - targetStep) : (21 - targetStep)

    if (isFinaleStep) {
      animatingStepRef.current = targetStep
      isDecryptingRef.current = true
      setIsDecrypting(true)
      setDecryptingRank(currentRank)
      setRevealingTeamName(top5Ref.current[currentRank - 1]?.teamName || '')

      const candidateNames = filtered.map(t => t.teamName)
      let scrambleIdx = 0
      let scrambleInterval: any = null

      const runScramble = (speed: number) => {
        if (scrambleInterval) clearInterval(scrambleInterval)
        scrambleInterval = setInterval(() => {
          if (candidateNames.length > 0) {
            setScrambledName(candidateNames[scrambleIdx % candidateNames.length])
            scrambleIdx++
          }
        }, speed)
      }

      if (targetStep === FINALE_CUTOFF) {
        const startFrom = finaleCountdownStart(targetStep)
        const tick = 1100
        for (let n = startFrom; n >= 1; n--) {
          const delay = (startFrom - n) * tick
          const beat = startFrom - n + 1
          const scrambleSpeed = 50 + (startFrom - n) * 40
          const apply = () => {
            setCountdownNum(n)
            speakCountdown(COUNTDOWN_WORDS[n] || String(n))
            if (soundEnabled) playHeartbeatTick(beat)
            runScramble(scrambleSpeed)
          }
          if (delay === 0) apply()
          else setTimeout(apply, delay)
        }

        setTimeout(() => {
          clearInterval(scrambleInterval)
          isDecryptingRef.current = false
          animatingStepRef.current = 0
          revealedStepRef.current = FINALE_CUTOFF
          setIsDecrypting(false)
          setCountdownNum(null)
          setRevealedStep(FINALE_CUTOFF)
          if (soundEnabled) {
            playRevealChime(1)
          }
          triggerFinaleConfetti(1)
          speakCountdown('Grand Champion, ' + (top5Ref.current[0]?.teamName || 'Winner'))
        }, (startFrom - 1) * tick + 1400)

      } else {
        const startFrom = finaleCountdownStart(targetStep)
        const tick = 1100
        for (let n = startFrom; n >= 1; n--) {
          const delay = (startFrom - n) * tick
          const beat = startFrom - n + 1
          const scrambleSpeed = 60 + (startFrom - n) * 70
          const apply = () => {
            setCountdownNum(n)
            speakCountdown(COUNTDOWN_WORDS[n] || String(n))
            if (soundEnabled) playHeartbeatTick(beat)
            runScramble(scrambleSpeed)
          }
          if (delay === 0) apply()
          else setTimeout(apply, delay)
        }

        setTimeout(() => {
          clearInterval(scrambleInterval)
          isDecryptingRef.current = false
          animatingStepRef.current = 0
          revealedStepRef.current = targetStep
          setIsDecrypting(false)
          setCountdownNum(null)
          setRevealedStep(targetStep)
          if (soundEnabled) {
            playRevealChime(currentRank)
          }
          triggerFinaleConfetti(currentRank)
          const place = finalePlace(currentRank)
          const winnerName = top5Ref.current[currentRank - 1]?.teamName || ''
          speakCountdown(place.speak + winnerName)
        }, (startFrom - 1) * tick + 1400)
      }

    } else {
      // Round 2: one admin click unseals one place, with a 5→0 countdown.
      animatingStepRef.current = targetStep
      isDecryptingRef.current = true
      setIsDecrypting(true)
      setDecryptingRank(currentRank)
      setRevealingTeamName(advancingRef.current[currentRank - 1]?.teamName || '')

      const candidateNames = (advancingRef.current.length > 0 ? advancingRef.current : filtered).map(t => t.teamName)
      let scrambleIdx = 0
      let scrambleInterval: any = null

      const runScramble = (speed: number) => {
        if (scrambleInterval) clearInterval(scrambleInterval)
        scrambleInterval = setInterval(() => {
          if (candidateNames.length > 0) {
            setScrambledName(candidateNames[scrambleIdx % candidateNames.length])
            scrambleIdx++
          }
        }, speed)
      }

      const startFrom = ROUND2_COUNTDOWN_START
      const tick = 1100
      for (let n = startFrom; n >= 0; n--) {
        const delay = (startFrom - n) * tick
        const beat = startFrom - n + 1
        const scrambleSpeed = 60 + (startFrom - n) * 70
        const apply = () => {
          setCountdownNum(n)
          speakCountdown(COUNTDOWN_WORDS[n] || String(n))
          if (soundEnabled) playHeartbeatTick(beat)
          runScramble(scrambleSpeed)
        }
        if (delay === 0) apply()
        else setTimeout(apply, delay)
      }

      setTimeout(() => {
        clearInterval(scrambleInterval)
        isDecryptingRef.current = false
        animatingStepRef.current = 0
        revealedStepRef.current = targetStep
        setIsDecrypting(false)
        setCountdownNum(null)
        setRevealedStep(targetStep)
        unlockedRanksRef.current = unlockedRanksRef.current.includes(currentRank)
          ? unlockedRanksRef.current
          : [...unlockedRanksRef.current, currentRank]
        setUnlockedRanks(unlockedRanksRef.current)
        if (soundEnabled) {
          playRevealChime(currentRank)
        }
        const winnerName = advancingRef.current[currentRank - 1]?.teamName || ''
        speakCountdown(`Number ${currentRank}, ` + winnerName)
      }, startFrom * tick + 1400)
    }
  }

  // Keep the LCD locked on the countdown card until the name is unsealed
  useEffect(() => {
    if (!isDecrypting) return
    window.scrollTo({ top: 0, behavior: 'auto' })
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isDecrypting])

  // After each Top 20 card, scroll the table to that team's row. Repeats every reveal.
  useEffect(() => {
    if (!isRevealing) return

    if (isFinale) {
      if (isDecrypting || revealedStep < FINALE_CUTOFF) return
      const timer = setTimeout(() => {
        rosterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 7000)
      return () => clearTimeout(timer)
    }

    if (isDecrypting || unlockedRanks.length === 0) return

    const rank = 21 - revealedStep
    const timer = setTimeout(() => {
      const row = rowRefs.current[rank]
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        rosterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 7000)

    return () => clearTimeout(timer)
  }, [isRevealing, revealedStep, isFinale, isDecrypting, unlockedRanks.length])

  // Round 2 is one-click-per-team from the admin table — never auto-play 20→1.

  // Current spotlight team during countdown
  // For Round 2 (20 -> 1): Step 1 reveals rank 20, Step 20 reveals rank 1
  // For Round 3 (5 -> 1): Step 1 reveals rank 5, Step 5 reveals rank 1
  const currentSpotlightRank = isFinale ? (FINALE_CUTOFF + 1 - revealedStep) : (21 - revealedStep)
  const finaleRoster = top5.length > 0 ? top5 : top5Ref.current

  // Keep a stable finale roster even if a later fetch returns no rows.
  const currentSpotlightTeam = revealedStep > 0
    ? (isFinale
      ? (finaleRoster[FINALE_CUTOFF - revealedStep] || finaleRoster[finaleRoster.length - 1] || null)
      : (advancing[20 - revealedStep] || advancing[advancing.length - 1] || null))
    : null


  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden" style={{
      backgroundColor: '#EBE3D5',
      backgroundImage: 'radial-gradient(#d4caba 1px, transparent 1px)',
      backgroundSize: '32px 32px',
      fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
      color: '#1A1A1A'
    }}>

      {/* ── Top Bar ── */}
      <div className="relative z-20 flex items-center justify-between px-6 sm:px-10 py-4 border-b backdrop-blur-md sticky top-0 transition-colors bg-[#EBE3D5]/80 border-black/5 text-[#1A1A1A]">
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
          {/* Active TV Mode Indicator (Controlled by Admin Panel) */}
          {!isRevealing && tvMode && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 shadow-xs animate-pulse">
              <Monitor size={13} className="text-emerald-600 stroke-[2.2]" />
              <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">TV Auto-Scroll</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 shadow-xs">
            <Flame size={13} className="text-orange-500 fill-orange-500/20" />
            <span className="text-[11px] font-black text-[#E83C00] tracking-widest uppercase">Live</span>
          </div>

          <span className="font-mono text-base sm:text-lg font-bold tracking-wider text-slate-600">
            {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 🎭 DRAMATIC GRAND REVEAL CEREMONY (Round 2: 20➔1 | Round 3: 5➔1)      */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {isRevealing ? (
        <div className="relative z-10 flex-1 flex flex-col items-center pt-8 pb-24 px-4 sm:px-6 max-w-6xl mx-auto w-full">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full mb-3 shadow-xl ${
              isFinale 
                ? 'bg-amber-950/80 border border-amber-500/40 text-amber-300 shadow-amber-900/30' 
                : 'bg-white border border-black/5 text-slate-700 shadow-black/5'
            }`}>
              {isFinale ? <Crown size={15} className="text-amber-400 fill-amber-400/40" /> : <Trophy size={14} className="text-amber-500" />}
              <span className="text-xs font-black uppercase tracking-widest">
                {isFinale ? '👑 Grand Finale · Champions Coronation' : 'Round 1 Qualifiers - Live Ceremony'}
              </span>
            </div>
            <h2 className="text-[#E83C00] font-bold tracking-[0.2em] uppercase text-sm mb-2">
              AI குரல் · VOICE FOR TAMIL NADU · 2026
            </h2>
            <h1 className="text-5xl sm:text-6xl font-black text-[#1A1A1A] tracking-tighter" style={{ textShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
              {isFinale ? 'Top 5 Grand Finale Winners' : 'Top 20 Grand Reveal'}
            </h1>
          </motion.div>

          {/* 🌟 HERO SPOTLIGHT ANNOUNCEMENT CARD */}
          <div className="w-full max-w-3xl mb-10">
            <AnimatePresence mode="wait">
              {isDecrypting ? (
                <motion.div
                  key="decrypting-lcd-card"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.08 }}
                  transition={{ duration: 0.4 }}
                  className="relative p-8 sm:p-12 rounded-[2.5rem] overflow-hidden shadow-2xl text-center border-2 bg-gradient-to-b from-[#241308] via-[#140b04] to-[#080402] border-amber-500 text-white ring-4 ring-amber-500/40 shadow-[0_0_80px_rgba(245,158,11,0.4)]"
                >
                  {/* Animated Background Laser Radar */}
                  <div className="absolute inset-0 bg-radial from-amber-500/20 via-transparent to-transparent pointer-events-none animate-pulse" />

                  {/* Top Decryption Tag */}
                  <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 bg-amber-950/90 border border-amber-500/60 text-amber-300 shadow-md">
                    <Sparkles size={14} className="text-amber-400 animate-spin" />
                    <span>
                      {isFinale
                        ? (decryptingRank === 1
                          ? '👑 Unsealing Grand Champion (1st Place)...'
                          : decryptingRank === 2
                          ? '🥈 Decrypting 1st Runner Up (2nd Place)...'
                          : decryptingRank === 3
                          ? '🥉 Decrypting 2nd Runner Up (3rd Place)...'
                          : decryptingRank === 4
                          ? 'Decrypting 4th Place...'
                          : 'Decrypting 5th Place...')
                        : `Decrypting #${decryptingRank}...`}
                    </span>
                  </div>

                  {/* Giant Countdown Pulse */}
                  <div className="relative my-3 flex items-center justify-center">
                    <motion.div
                      key={countdownNum}
                      initial={{ scale: 2.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                      className="text-7xl sm:text-9xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-orange-500 drop-shadow-[0_0_40px_rgba(251,191,36,0.9)]"
                    >
                      {countdownNum}
                    </motion.div>
                  </div>

                  {/* Slot reels built from the admin-selected team name */}
                  <div className="min-h-16 flex items-center justify-center py-2">
                    <WinnerLetterReels name={revealingTeamName} spinning={isDecrypting} />
                  </div>

                  {/* Decryption Progress Bar */}
                  <div className="w-full max-w-md mx-auto mt-6 bg-black/60 rounded-full h-2.5 overflow-hidden border border-amber-500/40 shadow-inner">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 6, ease: 'linear' }}
                      className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-orange-500 shadow-md"
                    />
                  </div>
                  <p className="text-xs text-amber-400 font-mono font-bold uppercase tracking-widest mt-4 animate-pulse">
                    ⚡ ANALYZING FINAL EVALUATION MARKS · STAND BY ⚡
                  </p>
                </motion.div>
              ) : revealedStep === 0 ? (
                <motion.div
                  key="ready-state"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-8 sm:p-10 rounded-[2.5rem] shadow-2xl text-center relative overflow-hidden border-2 ${
                    isFinale
                      ? 'bg-gradient-to-b from-[#1c140e] to-[#0c0906] border-amber-500/40 text-white shadow-orange-950/40'
                      : 'bg-[#F4ECE1] border-black/10 text-[#1A1A1A] shadow-black/10'
                  }`}
                >
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm relative ${
                    isFinale ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' : 'bg-[#E83C00]/10 border border-[#E83C00]/20 text-[#E83C00]'
                  }`}>
                    {isFinale ? (
                      <>
                        <Crown size={40} className="text-amber-400 animate-bounce" />
                        <div className="absolute inset-0 rounded-3xl border border-amber-400/40 animate-ping opacity-30" />
                      </>
                    ) : (
                      <Trophy size={38} />
                    )}
                  </div>
                  <h3 className={`text-2xl sm:text-3xl font-black mb-2 ${isFinale ? 'text-white' : 'text-[#1A1A1A]'}`}>
                    {isFinale ? '👑 Grand Finale Verdict Sealed!' : 'Round 1 Graded & Verified!'}
                  </h3>
                  <p className={`max-w-lg mx-auto text-sm sm:text-base font-medium ${isFinale ? 'text-slate-300' : 'text-slate-500'}`}>
                    {isFinale
                      ? 'Waiting for the admin to unseal 5th Place. Each place opens only when its controller button is pressed.'
                      : 'Waiting for the admin to start the Top 20 announcement from the rounds console.'}
                  </p>
                </motion.div>
              ) : currentSpotlightTeam ? (

                <motion.div
                  key={`spotlight-${currentSpotlightRank}-${currentSpotlightTeam.teamId}`}
                  initial={{ opacity: 0, scale: 0.85, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.05, y: -20 }}
                  transition={{ type: 'spring', bounce: 0.35, duration: 0.65 }}
                  className={`relative p-7 sm:p-10 rounded-[2.5rem] overflow-hidden shadow-2xl text-center border-2 ${
                    isFinale && currentSpotlightRank === 1
                      ? 'bg-gradient-to-b from-[#2e1205] via-[#1a0a02] to-[#0d0501] border-[#E83C00] text-white ring-4 ring-amber-400/80 shadow-[0_0_80px_rgba(232,60,0,0.5)]'
                      : isFinale && currentSpotlightRank === 2
                      ? 'bg-gradient-to-b from-[#1e293b] to-[#0f172a] border-slate-400 text-white shadow-slate-900/40'
                      : isFinale && currentSpotlightRank === 3
                      ? 'bg-gradient-to-b from-[#2b170c] to-[#120904] border-amber-700 text-white shadow-amber-950/40'
                      : 'bg-[#F4ECE1] text-[#1A1A1A] border-black/10 shadow-black/10'
                  }`}
                  style={{
                    borderColor: !isFinale
                      ? (currentSpotlightRank === 1 ? '#E83C00' : currentSpotlightRank === 2 ? '#475569' : currentSpotlightRank === 3 ? '#B45309' : '#059669')
                      : undefined
                  }}
                >
                  {/* Announcement Tag */}
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 shadow-sm"
                    style={{
                      backgroundColor: currentSpotlightRank === 1 ? '#E83C00' : currentSpotlightRank === 2 ? '#475569' : currentSpotlightRank === 3 ? '#B45309' : '#059669',
                      color: '#FFFFFF'
                    }}>
                    {currentSpotlightRank === 1 ? (
                      <>
                        <Crown size={14} className="text-amber-300 fill-amber-300/30 stroke-[2.5]" />
                        <span>{isFinale ? '👑 Grand Champion · 1st Place' : '1st Place Finalist'}</span>
                      </>
                    ) : currentSpotlightRank === 2 ? (
                      <>
                        <Medal size={14} className="text-slate-200 stroke-[2.5]" />
                        <span>{isFinale ? '🥈 1st Runner Up · 2nd Place' : '2nd Place Finalist'}</span>
                      </>
                    ) : currentSpotlightRank === 3 ? (
                      <>
                        <Award size={14} className="text-amber-200 stroke-[2.5]" />
                        <span>{isFinale ? '🥉 2nd Runner Up · 3rd Place' : '3rd Place Finalist'}</span>
                      </>
                    ) : currentSpotlightRank === 4 && isFinale ? (
                      <>
                        <Medal size={14} className="text-slate-200 stroke-[2.5]" />
                        <span>4th Place</span>
                      </>
                    ) : currentSpotlightRank === 5 && isFinale ? (
                      <>
                        <Medal size={14} className="text-stone-200 stroke-[2.5]" />
                        <span>5th Place</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={14} className="text-emerald-200 stroke-[2.5]" />
                        <span>Qualified For Round 2</span>
                      </>
                    )}
                  </div>

                  {/* Giant Rank */}
                  <div className="text-6xl sm:text-7xl font-black mb-3 tracking-tighter"
                    style={{
                      color: isFinale && currentSpotlightRank === 1
                        ? '#FBBF24'
                        : isFinale && currentSpotlightRank === 2
                        ? '#CBD5E1'
                        : isFinale && currentSpotlightRank === 3
                        ? '#F59E0B'
                        : (currentSpotlightRank === 1 ? '#E83C00' : currentSpotlightRank === 2 ? '#334155' : currentSpotlightRank === 3 ? '#B45309' : '#047857')
                    }}>
                    {isFinale && currentSpotlightRank === 1 ? '👑 GRAND CHAMPION' : `#${currentSpotlightRank}`}
                  </div>

                  {/* Team Name */}
                  <h2 className={`text-3xl sm:text-5xl font-black tracking-tight mb-2 truncate px-4 ${
                    isFinale ? 'text-white' : 'text-[#1A1A1A]'
                  }`}>
                    {currentSpotlightTeam.teamName}
                  </h2>

                  {/* College & Track */}
                  <div className={`flex items-center justify-center gap-2.5 flex-wrap text-sm sm:text-base font-medium mb-6 ${
                    isFinale ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    <span>{currentSpotlightTeam.college || 'Tamil Nadu'}</span>
                    <span className="opacity-40">•</span>
                    <span className="px-3 py-1 rounded-lg bg-white text-slate-800 text-xs font-bold border border-black/10 shadow-sm">
                      {getTrackConfig(currentSpotlightTeam.track).label}
                    </span>
                  </div>

                  {/* Score Card */}
                  <div className="inline-flex items-center gap-3 px-7 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-sm">
                    <span className={`text-xs font-bold uppercase tracking-widest ${isFinale ? 'text-amber-200' : 'text-slate-500'}`}>
                      {isFinale ? 'Final Score' : 'Round 1 Score'}
                    </span>
                    <span className={`text-3xl sm:text-4xl font-black font-mono ${isFinale ? 'text-amber-300' : 'text-[#1A1A1A]'}`}>
                      {Number(currentSpotlightTeam.totalScore || 0).toFixed(1)}
                    </span>
                  </div>

                  {/* Progress Indicator */}
                  <div className="mt-7 pt-4 border-t border-black/10 flex items-center justify-between text-xs text-slate-500 font-semibold px-2">
                    <span className={`font-mono ${isFinale ? 'text-slate-400' : 'text-slate-500'}`}>
                      Progress: {revealedStep} of {maxSteps} revealed
                    </span>
                    {revealedStep === maxSteps ? (
                      <span className={isFinale ? 'text-amber-300 font-bold' : 'text-slate-700 font-bold'}>
                        {isFinale ? 'Ceremony complete' : 'Announcement complete'}
                      </span>
                    ) : (
                      <span className={isFinale ? 'text-amber-300 font-bold' : 'text-slate-700 font-bold'}>
                        Next: {isFinale
                          ? (currentSpotlightRank <= 1 ? 'Ceremony complete'
                            : currentSpotlightRank === 2 ? 'Grand Champion (#1 👑)'
                            : currentSpotlightRank === 3 ? '1st Runner Up (#2 🥈)'
                            : currentSpotlightRank === 4 ? '2nd Runner Up (#3 🥉)'
                            : currentSpotlightRank === 5 ? '4th Place'
                            : currentSpotlightRank === 6 ? '5th Place'
                            : `#${currentSpotlightRank - 1}`)
                          : `#${currentSpotlightRank - 1}`}
                      </span>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* BOTTOM VIEW: Top 20 Table (for Round 2) OR 3D Podium (for Round 3) */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {isFinale ? (
            !isDecrypting ? (
            /* ROUND 3: WINNERS PODIUM — hidden during the countdown card */
            <div ref={rosterRef} className="w-full max-w-5xl flex flex-col items-center">
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
                            {isCurrentlyDecrypting ? `⚡ DECIPHERING (${countdownNum}s) ⚡` : isNextToUnlock ? '⚡ Next To Crown ⚡' : '🔒 Awaiting Reveal...'}
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
            ) : null
          ) : !isDecrypting ? (
            /* ROUND 2: TOP 20 QUALIFIERS TABLE — hidden during the countdown card */
            <div ref={rosterRef} className="w-full max-w-5xl rounded-[2rem] overflow-hidden shadow-2xl shadow-black/10 border border-black/5 bg-[#F4ECE1]">
              {/* Header with Title & Status Counter */}
              <div className="flex items-center justify-between px-6 py-4 bg-[#F4ECE1] border-b border-black/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                    <Trophy size={16} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[#1A1A1A]">Round 2 · Top 20 Qualifiers</h3>
                    <p className="text-xs text-slate-500 font-medium">Announced teams appear here after each card</p>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-800 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 shadow-sm font-mono">
                  {unlockedRanks.length} / {Math.min(20, advancing.length)} Unlocked
                </span>
              </div>

              {/* Table Column Headers */}
              <div className="grid grid-cols-[64px_1fr_170px_110px_120px] px-6 py-3.5 bg-[#1A1A1A] text-[10px] font-bold text-white/70 uppercase tracking-widest">
                <div className="text-center">Rank</div>
                <div>Team & College</div>
                <div>Track</div>
                <div className="text-center">Score</div>
                <div className="text-right">Status</div>
              </div>

              {/* Rows (1 to 20, neat single column row-by-row like Round 1) */}
              <div className="flex flex-col">
                {Array.from({ length: Math.min(20, advancing.length || 20) }).map((_, idx) => {
                  const rankNum = idx + 1 // 1 to 20
                  const team = advancing[idx]
                  const isRevealed = unlockedRanks.includes(rankNum)
                  const isSpotlight = rankNum === currentSpotlightRank && revealedStep > 0
                  const track = team ? getTrackConfig(team.track) : null

                  if (!isRevealed || !team) {
                    return (
                      <motion.div
                        key={`slot-locked-${rankNum}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-[64px_1fr_170px_110px_120px] px-6 py-3.5 items-center border-b border-black/[0.04] bg-[#EBE3D5]/40 text-slate-400 opacity-60"
                      >
                        <div className="flex items-center justify-center">
                          <span className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center font-black text-xs text-slate-400">
                            #{rankNum}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Lock size={13} className="animate-pulse text-slate-400" />
                          <span className="text-xs font-semibold tracking-wide">Locked & Pending Announcement...</span>
                        </div>
                        <div>
                          <div className="w-20 h-5 rounded-lg bg-black/5 animate-pulse" />
                        </div>
                        <div className="text-center">
                          <span className="text-xs font-mono text-slate-300">--</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending</span>
                        </div>
                      </motion.div>
                    )
                  }

                    return (
                      <motion.div
                        key={`slot-revealed-${rankNum}-${team.teamId}`}
                        id={`r2-row-${rankNum}`}
                        ref={(el) => { rowRefs.current[rankNum] = el }}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`grid grid-cols-[64px_1fr_170px_110px_120px] px-6 py-3.5 items-center border-b transition-colors ${
                          isSpotlight
                            ? 'bg-[#E83C00]/15 border-[#E83C00]/40 shadow-md ring-1 ring-[#E83C00]/30'
                          : rankNum === 1
                          ? 'bg-orange-500/5 hover:bg-orange-500/10 border-black/5'
                          : 'bg-[#F4ECE1] hover:bg-white/60 border-black/5'
                      }`}
                    >
                      {/* Rank Badge */}
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

                      {/* Team & College */}
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={team.teamName} size="sm" className="shrink-0 ring-2 ring-white shadow-sm" />
                        <div className="min-w-0">
                          <div className="font-bold truncate text-slate-900 text-sm flex items-center gap-2">
                            <span>{team.teamName}</span>
                            {rankNum === 1 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-orange-100 text-[#E83C00] border border-orange-300 tracking-wider uppercase shadow-xs">
                                <Crown size={9} className="text-[#E83C00]" /> Leader
                              </span>
                            )}
                            {rankNum === 2 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-200 text-slate-700 border border-slate-300 tracking-wider uppercase shadow-xs">
                                <Medal size={9} className="text-slate-600" /> 2nd
                              </span>
                            )}
                            {rankNum === 3 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300 tracking-wider uppercase shadow-xs">
                                <Award size={9} className="text-amber-700" /> 3rd
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 truncate">{team.college}</div>
                        </div>
                      </div>

                      {/* Track */}
                      <div>
                        {track && (
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border bg-white shadow-sm"
                            style={{ color: track.color, borderColor: `${track.color}30` }}
                          >
                            {track.label}
                          </span>
                        )}
                      </div>

                      {/* Score */}
                      <div className="text-center font-mono font-black text-sm text-[#1A1A1A]">
                        {team.totalScore.toFixed(1)}
                      </div>

                      {/* Qualified Status */}
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm uppercase tracking-wide">
                          <CheckCircle2 size={11} className="text-emerald-600 stroke-[2.5]" />
                          Qualified
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>


      ) : (
        /* ════════════════════════════════════════════════════════════════════ */
        /* STANDARD STAGE 1 / 2 / 3 LEADERBOARDS                                */
        /* ════════════════════════════════════════════════════════════════════ */
        <div className="relative z-10 flex-1 flex flex-col items-center pt-8 pb-20 px-6 max-w-6xl mx-auto w-full">

          {/* Header */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRound}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/5 text-slate-700 mb-4 shadow-xl shadow-black/5">
                <Trophy size={14} className="text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  {activeRound === 3 ? 'Stage 3: Top 5 Grand Finale Podium' : activeRound === 2 ? 'Stage 2: Top 20 Shortlist' : 'Stage 1: Live Judging'}
                </span>
              </div>
              <h2 className="text-[#E83C00] font-bold tracking-[0.2em] uppercase text-sm mb-2">
                AI குரல் · VOICE FOR TAMIL NADU · 2026
              </h2>
              <h1 className="text-5xl sm:text-6xl font-black text-[#1A1A1A] tracking-tighter" style={{ textShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
                {activeRound === 3 ? 'Top 5 Grand Finale Winners' : activeRound === 2 ? 'Round 2 · Top 20' : 'Live Evaluation Status'}
              </h1>
              <p className="text-slate-500 mt-2 text-sm font-medium">
                {activeRound === 3
                  ? `${filtered.length} finalists`
                  : activeRound === 2
                  ? (r3Teams.length > 0
                    ? `${advancing.length} shortlisted teams · waiting for admin to reveal the winners`
                    : `${filtered.length} teams competing · judges scoring live`)
                  : `${filtered.length} teams · tracking live evaluation completion`}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* ROUND 1 VIEW — Live Judging Status (Scores Hidden, 0/1 -> 1/1) */}
          {activeRound === 1 && (
            <div className="w-full rounded-[2rem] overflow-hidden shadow-2xl shadow-black/10 border border-black/5">
              {/* Table header */}
              <div className="grid grid-cols-[56px_1fr_170px_110px_110px] px-6 py-4 bg-[#1A1A1A] text-[10px] font-bold text-white/60 uppercase tracking-widest">
                <div className="text-center">#</div>
                <div>Team</div>
                <div>Track</div>
                <div className="text-center">Evaluation</div>
                <div className="text-right">Status</div>
              </div>

              {/* All teams listed with live 0/1 -> 1/1 evaluation status */}
              <div className="flex flex-col">
                <AnimatePresence>
                  {filtered.map((entry, idx) => (
                    <Round1Row key={entry.teamId} entry={entry} index={idx} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* ROUND 2 VIEW — full Top 20 list. No podium; winners stay sealed
              until the admin clicks Reveal 5th / 4th / runner-up / champion. */}
          {activeRound === 2 && (
            <div className="w-full max-w-5xl rounded-[2rem] bg-[#F4ECE1] shadow-2xl shadow-black/10 overflow-hidden border border-black/5">
              {r3Teams.length > 0 ? (
                <>
                  <div className="grid grid-cols-[1fr_200px] px-8 py-5 bg-[#EBE2D5] border-b border-black/5 text-xs font-bold text-slate-600 uppercase tracking-widest">
                    <div>Team</div>
                    <div>Track</div>
                  </div>
                  <div className="flex flex-col bg-[#F4ECE1]">
                    <AnimatePresence>
                      {[...advancing]
                        .sort((a, b) => a.teamName.localeCompare(b.teamName))
                        .map((entry) => (
                          <Round2Row key={entry.teamId} entry={entry} hideStandings />
                        ))}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-[80px_1fr_200px_120px_120px_80px] px-8 py-5 bg-[#EBE2D5] border-b border-black/5 text-xs font-bold text-slate-600 uppercase tracking-widest">
                    <div className="text-center">Rank</div>
                    <div>Team Details</div>
                    <div>Track</div>
                    <div className="text-center">Judges</div>
                    <div className="text-right">Score</div>
                    <div className="text-right">Change</div>
                  </div>
                  <div className="flex flex-col bg-[#F4ECE1]">
                    <AnimatePresence>
                      {advancing.map((entry) => (
                        <Round2Row key={entry.teamId} entry={entry} />
                      ))}
                    </AnimatePresence>
                  </div>
                </>
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
      )}
    </div>
  )
}

export default LeaderboardPage
