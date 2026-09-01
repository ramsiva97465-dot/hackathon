import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { SnapServeMark, VobizLockup } from '@/components/brand/BrandLogos'
import { Avatar } from '@/components/ui/Avatar'
import { getTrackConfig } from '@/lib/utils'
import { useWebSocket } from '@/hooks/useWebSocket'
import { 
  TrendingUp, TrendingDown, Minus, Trophy, ChevronRight, Monitor,
  Play, Pause, SkipForward, RotateCcw, Sparkles, Star, CheckCircle2, Lock, Flame, Zap, Award, Crown, Medal, X, Layers, ShieldCheck
} from 'lucide-react'
import type { LeaderboardEntry } from '@hackathon/shared'
import api from '@/lib/api'

const ROUND2_CUTOFF = 20 // Top 20 advance to round 2

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
function Round2Row({ entry }: { entry: LeaderboardEntry }) {
  const track = getTrackConfig(entry.track)
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
  const [searchParams, setSearchParams] = useSearchParams()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [clock, setClock] = useState(new Date())
  const [activeRound, setActiveRound] = useState<number>(1)
  const [manualOverride, setManualOverride] = useState(false)
  const [tvMode, setTvMode] = useState(() => {
    return localStorage.getItem('snapserve_tv_mode') === 'true'
  })

  // ── Grand Reveal State ─────────────────────────────────────────────────────
  // For Round 2: revealedStep 0..20 (Rank 20 down to 1)
  // For Round 3: revealedStep 0..3 (Rank 3 down to 1)
  const [revealRound, setRevealRound] = useState<number>(() => {
    const r = searchParams.get('round')
    return r ? Number(r) : 2
  })
  const [isRevealing, setIsRevealing] = useState<boolean>(searchParams.get('reveal') === 'true')
  const [revealedStep, setRevealedStep] = useState<number>(0)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [soundEnabled] = useState<boolean>(true)
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false)
  const [countdownNum, setCountdownNum] = useState<number | null>(null)
  const [scrambledName, setScrambledName] = useState<string>('')
  const [decryptingRank, setDecryptingRank] = useState<number | null>(null)
  const timerRef = useRef<any>(null)
  const rosterRef = useRef<HTMLDivElement>(null)


  const { emit } = useWebSocket<LeaderboardEntry[]>('leaderboard:update', (data) => {
    setEntries(data)
  })

  // Listen for broadcasted reveal triggers from admin panel
  useWebSocket<{ round?: number; type?: string }>('leaderboard:reveal_start', (data) => {
    startGrandReveal(data?.round || 2)
  })

  useWebSocket<{ step: number; round?: number }>('leaderboard:reveal_step', (data) => {
    if (typeof data?.step === 'number') {
      const targetRound = data.round || 3
      if (targetRound !== revealRound || !isRevealing) {
        setRevealRound(targetRound)
        setIsRevealing(true)
      }
      executeRevealToStep(data.step, targetRound)
    }
  })

  useWebSocket<{ isRevealing: boolean }>('leaderboard:reveal_stop', () => {
    stopGrandReveal()
  })

  useWebSocket<{ isRevealing: boolean; round?: number; step?: number }>('leaderboard:reveal_state', (data) => {
    if (data?.isRevealing) {
      const targetRound = data.round || 2
      if (!isRevealing || revealRound !== targetRound) {
        startGrandReveal(targetRound)
      }
      if (typeof data.step === 'number') {
        if (data.step === 0) {
          setRevealedStep(0)
          setIsDecrypting(false)
          setCountdownNum(null)
        } else if (data.step > revealedStep && !isDecrypting) {
          setRevealedStep(data.step)
        }
      }
    } else if (data && !data.isRevealing) {
      stopGrandReveal()
    }
  })

  // Listen for broadcasted TV Mode toggles from admin panel
  useWebSocket<{ tvMode: boolean }>('leaderboard:tv_mode', (data) => {
    if (typeof data?.tvMode === 'boolean') {
      setTvMode(data.tvMode)
      localStorage.setItem('snapserve_tv_mode', data.tvMode ? 'true' : 'false')
    }
  })

  const fetchLiveLeaderboard = async () => {
    try {
      const res = await api.leaderboard.get({ round: activeRound })
      if (Array.isArray(res.data)) {
        setEntries(res.data)
      }
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

  const fetchRevealState = async () => {
    try {
      const res = await api.leaderboard.getRevealState()
      if (res.data?.isRevealing) {
        const targetRound = res.data.round || 2
        if (!isRevealing || revealRound !== targetRound) {
          startGrandReveal(targetRound)
        }
        if (typeof res.data?.step === 'number') {
          if (res.data.step === 0 && revealedStep > 0) {
            setRevealedStep(0)
            setIsDecrypting(false)
            setCountdownNum(null)
          } else if (res.data.step > revealedStep && !isDecrypting) {
            setRevealedStep(res.data.step)
          }
        }
      } else if (res.data && !res.data.isRevealing && isRevealing && !searchParams.get('reveal')) {
        stopGrandReveal()
      }
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
  }, [activeRound, isRevealing])

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Check URL query for ?reveal=true
  useEffect(() => {
    if (searchParams.get('reveal') === 'true' && !isRevealing) {
      const roundParam = Number(searchParams.get('round')) || 2
      startGrandReveal(roundParam)
    }
  }, [searchParams])

  // TV Mode Auto-scroll logic
  useEffect(() => {
    if (!tvMode || isRevealing) return
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
  }, [tvMode, isRevealing])

  // Active round is controlled explicitly via search params or when reveal runs
  useEffect(() => {
    const r = searchParams.get('round')
    if (r) {
      setActiveRound(Number(r))
    }
  }, [searchParams])

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

  // Official Top 3 for Grand Finale:
  // If teams were promoted to Round 3 in database (team.round === 3), prioritize them; otherwise top 3 overall
  const r3Teams = rawDisplay.filter(e => ((e as any).round || 1) === 3)
  const top3 = ((r3Teams.length >= 3 ? r3Teams : rawDisplay).length > 0 ? (r3Teams.length >= 3 ? r3Teams : rawDisplay) : filtered)
    .slice()
    .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
    .slice(0, 3)
    .map((e, idx) => ({ ...e, rank: idx + 1 }))

  const restR2 = filtered.slice(3)
  const podiumOrder = [
    top3[1] || top3[0], // Rank 2 Silver (Left)
    top3[0],            // Rank 1 Gold (Center)
    top3[2] || top3[0], // Rank 3 Bronze (Right)
  ]

  const isFinale = revealRound === 3
  const maxSteps = isFinale ? 3 : Math.min(20, advancing.length || 20)

  // ── Grand Reveal Logic ─────────────────────────────────────────────────────
  const startGrandReveal = (round: number = 2) => {
    setRevealRound(round)
    setIsRevealing(true)
    setRevealedStep(0)
    setIsPaused(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const stopGrandReveal = () => {
    setIsRevealing(false)
    setRevealedStep(maxSteps)
    searchParams.delete('reveal')
    searchParams.delete('round')
    setSearchParams(searchParams, { replace: true })
  }

  const executeRevealToStep = (targetStep: number, targetRound?: number) => {
    const effectiveRound = targetRound || revealRound || 3
    if (targetRound && targetRound !== revealRound) {
      setRevealRound(targetRound)
    }
    if (!isRevealing) {
      setIsRevealing(true)
    }

    if (targetStep <= 0) {
      setRevealedStep(0)
      setIsDecrypting(false)
      setCountdownNum(null)
      return
    }

    if (targetStep <= revealedStep && !isDecrypting) {
      return
    }

    const isFinaleStep = effectiveRound === 3
    const currentRank = isFinaleStep ? (4 - targetStep) : (21 - targetStep)

    if (isFinaleStep) {
      setIsDecrypting(true)
      setDecryptingRank(currentRank)

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

      if (targetStep === 3) {
        // 👑 STEP 3 GRAND CLIMAX: 10 ➔ 9 ➔ 8 ➔ 7 ➔ 6 ➔ 5 ➔ 4 ➔ 3 ➔ 2 ➔ 1 ➔ 👑 with VOCAL ANNOUNCER!
        setCountdownNum(10)
        speakCountdown('Ten')
        if (soundEnabled) playHeartbeatTick(1)
        runScramble(50)

        setTimeout(() => { setCountdownNum(9); speakCountdown('Nine'); if (soundEnabled) playHeartbeatTick(2); runScramble(65) }, 1100)
        setTimeout(() => { setCountdownNum(8); speakCountdown('Eight'); if (soundEnabled) playHeartbeatTick(3); runScramble(80) }, 2200)
        setTimeout(() => { setCountdownNum(7); speakCountdown('Seven'); if (soundEnabled) playHeartbeatTick(4); runScramble(100) }, 3300)
        setTimeout(() => { setCountdownNum(6); speakCountdown('Six'); if (soundEnabled) playHeartbeatTick(5); runScramble(120) }, 4400)
        setTimeout(() => { setCountdownNum(5); speakCountdown('Five'); if (soundEnabled) playHeartbeatTick(6); runScramble(150) }, 5500)
        setTimeout(() => { setCountdownNum(4); speakCountdown('Four'); if (soundEnabled) playHeartbeatTick(7); runScramble(190) }, 6600)
        setTimeout(() => { setCountdownNum(3); speakCountdown('Three'); if (soundEnabled) playHeartbeatTick(8); runScramble(240) }, 7700)
        setTimeout(() => { setCountdownNum(2); speakCountdown('Two'); if (soundEnabled) playHeartbeatTick(9); runScramble(310) }, 8800)
        setTimeout(() => { setCountdownNum(1); speakCountdown('One'); if (soundEnabled) playHeartbeatTick(10); runScramble(400) }, 9900)

        // T = 11.3s: Unseal Grand Champion Climax!
        setTimeout(() => {
          clearInterval(scrambleInterval)
          setIsDecrypting(false)
          setCountdownNum(null)
          setRevealedStep(3)
          if (soundEnabled) {
            playRevealChime(1)
          }
          triggerFinaleConfetti(1)
          speakCountdown('Grand Champion, ' + (top3[0]?.teamName || 'Winner'))
        }, 11300)

      } else {
        // 🥉 🥈 STEPS 1 & 2: 5 ➔ 4 ➔ 3 ➔ 2 ➔ 1 with VOCAL ANNOUNCER!
        setCountdownNum(5)
        speakCountdown('Five')
        if (soundEnabled) playHeartbeatTick(1)
        runScramble(60)

        setTimeout(() => { setCountdownNum(4); speakCountdown('Four'); if (soundEnabled) playHeartbeatTick(2); runScramble(90) }, 1100)
        setTimeout(() => { setCountdownNum(3); speakCountdown('Three'); if (soundEnabled) playHeartbeatTick(3); runScramble(140) }, 2200)
        setTimeout(() => { setCountdownNum(2); speakCountdown('Two'); if (soundEnabled) playHeartbeatTick(4); runScramble(220) }, 3300)
        setTimeout(() => { setCountdownNum(1); speakCountdown('One'); if (soundEnabled) playHeartbeatTick(5); runScramble(350) }, 4400)

        // T = 5.7s: Unseal Runner Up!
        setTimeout(() => {
          clearInterval(scrambleInterval)
          setIsDecrypting(false)
          setCountdownNum(null)
          setRevealedStep(targetStep)
          if (soundEnabled) {
            playRevealChime(currentRank)
          }
          triggerFinaleConfetti(currentRank)
          const runnerUpName = currentRank === 2 ? top3[1]?.teamName : top3[2]?.teamName
          speakCountdown((currentRank === 2 ? '1st Runner Up, ' : '2nd Runner Up, ') + (runnerUpName || ''))
        }, 5700)
      }

    } else {
      // Round 2 standard reveal
      setRevealedStep(targetStep)
      if (soundEnabled) {
        playRevealChime(currentRank)
      }
    }
  }

  const stepNextReveal = () => {
    if (isDecrypting) return // Prevent clicking during active decryption

    const next = Math.min(maxSteps, revealedStep + 1)
    if (next === revealedStep) return

    executeRevealToStep(next)
    api.leaderboard.setRevealStep(next).catch(() => {})
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

  // Auto-scroll loop for Top 20 (Round 2) or Podium scroll (Round 3)
  useEffect(() => {
    if (!isRevealing) return

    if (isFinale) {
      if (isDecrypting || revealedStep < 3) return
      const timer = setTimeout(() => {
        rosterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 7000)
      return () => clearTimeout(timer)
    }

    if (revealedStep < 20) return

    let isPausedAtBoundary = false
    let scrollInterval: ReturnType<typeof setInterval> | null = null
    let pauseTimeout: ReturnType<typeof setTimeout> | null = null

    // Step 1: After initial 2.5s, scroll down to the Top 20 table
    const initialScroll = setTimeout(() => {
      rosterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

      // Step 2: Start continuous looping scroll after table comes into view
      pauseTimeout = setTimeout(() => {
        scrollInterval = setInterval(() => {
          if (isPausedAtBoundary) return

          window.scrollBy({ top: 1, behavior: 'auto' })

          const atBottom = (window.innerHeight + Math.ceil(window.scrollY)) >= document.body.offsetHeight - 12
          if (atBottom) {
            isPausedAtBoundary = true
            // Pause at bottom for 2.5s so audience can read Rank #15-#20
            pauseTimeout = setTimeout(() => {
              // Smooth scroll back up to Rank #1 (Top of Table)
              rosterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              // Pause at top for 2.5s so audience can read Rank #1-#5 before scrolling down again
              pauseTimeout = setTimeout(() => {
                isPausedAtBoundary = false
              }, 2500)
            }, 2500)
          }
        }, 32) // ~31px/sec smooth readable scroll speed
      }, 1500)
    }, 2500)

    return () => {
      clearTimeout(initialScroll)
      if (pauseTimeout) clearTimeout(pauseTimeout)
      if (scrollInterval) clearInterval(scrollInterval)
    }
  }, [isRevealing, revealedStep, isFinale, isDecrypting])

  // Automatic Reveal Step Timer for Round 2 Auto-Play only (Round 3 Finale is 100% controlled by Admin Remote)
  useEffect(() => {
    if (!isRevealing || isPaused || isFinale) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    const delay = 2400

    timerRef.current = setInterval(() => {
      setRevealedStep(prev => {
        if (prev >= maxSteps) {
          clearInterval(timerRef.current)
          return prev
        }
        const next = prev + 1
        const currentRank = 21 - next
        if (soundEnabled) {
          playRevealChime(currentRank)
        }
        return next
      })
    }, delay)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRevealing, isPaused, isFinale, maxSteps, soundEnabled])

  // Current spotlight team during countdown
  // For Round 2 (20 -> 1): Step 1 reveals rank 20 (advancing[19]), Step 20 reveals rank 1 (advancing[0])
  // For Round 3 (3 -> 1): Step 1 reveals rank 3 (top3[2]), Step 2 reveals rank 2 (top3[1]), Step 3 reveals rank 1 (top3[0])
  const currentSpotlightRank = isFinale ? (4 - revealedStep) : (21 - revealedStep)
  const currentSpotlightTeam = revealedStep > 0
    ? (isFinale ? top3[3 - revealedStep] : advancing[20 - revealedStep])
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
            <SnapServeMark className="h-[24.32px] w-[24.32px] shrink-0 object-contain translate-y-[4px]" />
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
          {/* Close button only visible when reveal mode is currently active */}
          {isRevealing && (
            <button
              onClick={stopGrandReveal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all shadow-xs cursor-pointer"
              title="Exit Grand Reveal"
            >
              <X size={13} className="text-rose-600 stroke-[2.5]" />
              <span>Exit Announcement</span>
            </button>
          )}

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
      {/* 🎭 DRAMATIC GRAND REVEAL CEREMONY (Round 2: 20➔1 | Round 3: 3➔1)      */}
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
                {isFinale ? '👑 Grand Finale · Champions Coronation' : 'Round 2 Qualifiers · Live Ceremony'}
              </span>
            </div>
            <h2 className="text-[#E83C00] font-bold tracking-[0.2em] uppercase text-sm mb-2">
              AI குரல் · VOICE FOR TAMIL NADU · 2026
            </h2>
            <h1 className="text-5xl sm:text-6xl font-black text-[#1A1A1A] tracking-tighter" style={{ textShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
              {isFinale ? 'Top 3 Grand Finale Winners' : 'Top 20 Grand Reveal'}
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
                      {decryptingRank === 1
                        ? '👑 Unsealing Grand Champion (1st Place)...'
                        : decryptingRank === 2
                        ? '🥈 Decrypting 1st Runner Up (2nd Place)...'
                        : '🥉 Decrypting 2nd Runner Up (3rd Place)...'}
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

                  {/* Slot Machine Scrambled Name Roll */}
                  <div className="h-16 flex items-center justify-center">
                    <motion.div
                      key={scrambledName}
                      initial={{ opacity: 0.4, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-2xl sm:text-4xl font-mono font-black text-amber-200/90 tracking-wider truncate px-4"
                    >
                      {scrambledName || 'IDENTIFYING WINNER...'}
                    </motion.div>
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
                  <p className={`max-w-lg mx-auto text-sm sm:text-base mb-6 font-medium ${isFinale ? 'text-slate-300' : 'text-slate-500'}`}>
                    {isFinale 
                      ? 'The stage is set to unveil the 2nd Runner Up (#3), 1st Runner Up (#2), and crown the Grand Champion (#1) of Tamil Nadu!' 
                      : 'The ceremony will announce all 20 qualifying teams one by one, counting down from Rank #20 down to the #1 Leader!'}
                  </p>
                  <button
                    onClick={stepNextReveal}
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#E83C00] hover:bg-[#c93400] text-white rounded-2xl font-black text-sm shadow-xl shadow-orange-950/40 cursor-pointer transition-all hover:scale-105"
                  >
                    <Play size={15} fill="white" />
                    {isFinale ? '⚡ Begin Coronation Ceremony (#3 🥉)' : 'Start Announcement (#20)'}
                  </button>
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
                    {isFinale && currentSpotlightRank === 1 ? '👑 GRAND CHAMPION' : `RANK #${currentSpotlightRank}`}
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
                      {currentSpotlightTeam.totalScore.toFixed(1)}
                    </span>
                  </div>

                  {/* Progress Indicator */}
                  <div className="mt-7 pt-4 border-t border-black/10 flex items-center justify-between text-xs text-slate-500 font-semibold px-2">
                    <span className={`font-mono ${isFinale ? 'text-slate-400' : 'text-slate-500'}`}>
                      Progress: {revealedStep} of {maxSteps} revealed
                    </span>
                    {revealedStep === maxSteps ? (
                      <button
                        onClick={() => { setRevealedStep(0); }}
                        className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-black cursor-pointer"
                      >
                        <RotateCcw size={13} />
                        {isFinale ? '🔄 Replay Grand Finale Ceremony' : 'Replay Announcement'}
                      </button>
                    ) : (
                      <span className={isFinale ? 'text-amber-300 font-bold' : 'text-slate-700 font-bold'}>
                        Next: {isFinale ? (currentSpotlightRank === 3 ? '1st Runner Up (#2 🥈)' : 'Grand Champion (#1 👑)') : `Rank #${currentSpotlightRank - 1}`}
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
            /* ROUND 3: WINNERS PODIUM */
            <div ref={rosterRef} className="w-full max-w-5xl flex flex-col items-center">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/5 text-slate-700 mb-6 shadow-sm">
                <Trophy size={14} className="text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Official Stage 3 Podium · Top 3 Winners
                </span>
              </div>

              <div className="flex items-end justify-center gap-4 sm:gap-8 w-full max-w-4xl">
                {podiumOrder.map((entry, idx) => {
                  if (!entry) return null
                  const isFirst = entry.rank === 1
                  const heights = { 1: 'h-[400px] sm:h-[450px]', 2: 'h-[320px] sm:h-[360px]', 3: 'h-[280px] sm:h-[320px]' }
                  const cardStyles = {
                    1: { bg: '#F4ECE1', border: '#E83C00', badge: 'bg-[#E83C00] text-white', shadow: 'shadow-2xl shadow-orange-900/30 ring-4 ring-amber-400/60' },
                    2: { bg: '#F4ECE1', border: '#475569', badge: 'bg-slate-700 text-white', shadow: 'shadow-xl shadow-black/10 ring-2 ring-slate-400/40' },
                    3: { bg: '#F4ECE1', border: '#B45309', badge: 'bg-amber-800 text-white', shadow: 'shadow-xl shadow-black/10 ring-2 ring-amber-600/40' },
                  }
                  const style = cardStyles[entry.rank as keyof typeof cardStyles]
                  // Unlocked step condition: Step 1 reveals #3, Step 2 reveals #2, Step 3 reveals #1
                  const isUnlocked = revealedStep >= (4 - entry.rank)

                  if (!isUnlocked) {
                    const isNextToUnlock = revealedStep === (3 - entry.rank)
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
                        className={`relative flex flex-col items-center justify-between p-6 sm:p-8 rounded-[2.5rem] w-1/3 ${heights[entry.rank as keyof typeof heights]} shadow-2xl overflow-hidden border-2 transition-all`}
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
                              : entry.rank === 2 
                              ? '🥈 1st Runner Up' 
                              : '🥉 2nd Runner Up'}
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
                            {isFirst ? '👑 GRAND CHAMPION' : entry.rank === 2 ? '🥈 1ST RUNNER UP' : '🥉 2ND RUNNER UP'}
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
                      className={`relative flex flex-col items-center p-6 sm:p-8 rounded-[2.5rem] w-1/3 ${heights[entry.rank as keyof typeof heights]} ${style.shadow} transition-all`}
                      style={{
                        backgroundColor: style.bg,
                        border: isFirst ? '3px solid #E83C00' : `2px solid ${style.border}`,
                        boxShadow: isFirst
                          ? '0 25px 60px -12px rgba(232, 60, 0, 0.4), 0 0 35px rgba(245, 158, 11, 0.35)'
                          : style.shadow
                      }}
                    >
                      {/* Top Badge */}
                      <div className={`absolute -top-6 px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl flex items-center gap-1.5 justify-center font-black text-sm sm:text-base shadow-xl ${style.badge}`}>
                        {isFirst ? (
                          <>
                            <Crown size={18} className="text-amber-300 fill-amber-300 stroke-[2.5] animate-bounce" />
                            <span>👑 Grand Champion</span>
                          </>
                        ) : entry.rank === 2 ? (
                          <>
                            <Medal size={18} className="text-slate-200 stroke-[2.5]" />
                            <span>🥈 1st Runner Up</span>
                          </>
                        ) : (
                          <>
                            <Award size={18} className="text-amber-200 stroke-[2.5]" />
                            <span>🥉 2nd Runner Up</span>
                          </>
                        )}
                      </div>

                      {/* Avatar & Team Info */}
                      <div className="mt-7 sm:mt-9 flex flex-col items-center text-center flex-1 w-full min-w-0">
                        <div className="relative">
                          <Avatar name={entry.teamName} size="lg" className={`mb-3 shadow-lg ring-4 ${isFirst ? 'ring-[#E83C00] shadow-orange-500/40' : entry.rank === 2 ? 'ring-slate-400 shadow-slate-500/20' : 'ring-amber-600 shadow-amber-600/20'}`} />
                          {isFirst && (
                            <div className="absolute -top-3 -right-2 bg-amber-400 text-slate-900 rounded-full p-1 shadow-md animate-bounce">
                              <Crown size={14} className="fill-slate-900" />
                            </div>
                          )}
                        </div>
                        <h3 className="text-lg sm:text-2xl font-black text-[#1A1A1A] mb-1 truncate w-full">{entry.teamName}</h3>
                        <p className="text-slate-500 font-medium text-xs sm:text-sm truncate w-full">{entry.college}</p>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-800 border border-black/10 shadow-xs">
                            {getTrackConfig(entry.track).label}
                          </span>
                        </div>
                      </div>

                      {/* Final Score */}
                      <div className="w-full pt-4 mt-auto border-t border-black/10 text-center">
                        <motion.div key={entry.totalScore} initial={{ scale: 1.25 }} animate={{ scale: 1 }}
                          className={`text-3xl sm:text-4xl font-black font-mono ${isFirst ? 'text-[#E83C00]' : 'text-[#1A1A1A]'}`}>
                          {entry.totalScore.toFixed(1)}
                        </motion.div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">Final Score</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ) : (
            /* ROUND 2: TOP 20 QUALIFIERS TABLE */
            <div ref={rosterRef} className="w-full max-w-5xl rounded-[2rem] overflow-hidden shadow-2xl shadow-black/10 border border-black/5 bg-[#F4ECE1]">
              {/* Header with Title & Status Counter */}
              <div className="flex items-center justify-between px-6 py-4 bg-[#F4ECE1] border-b border-black/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                    <Trophy size={16} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[#1A1A1A]">Round 2 · Top 20 Qualifiers</h3>
                    <p className="text-xs text-slate-500 font-medium">Official shortlisted teams advancing to Round 2</p>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-800 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 shadow-sm font-mono">
                  {revealedStep} / {Math.min(20, advancing.length)} Unlocked
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
                  const isRevealed = rankNum >= (21 - revealedStep)
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
          )}
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
                  {activeRound === 3 ? 'Stage 3: Winners Podium' : activeRound === 2 ? 'Stage 2: Top 20 Shortlist' : 'Stage 1: Live Judging'}
                </span>
              </div>
              <h2 className="text-[#E83C00] font-bold tracking-[0.2em] uppercase text-sm mb-2">
                AI குரல் · VOICE FOR TAMIL NADU · 2026
              </h2>
              <h1 className="text-5xl sm:text-6xl font-black text-[#1A1A1A] tracking-tighter" style={{ textShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
                {activeRound === 3 ? 'Final Winners' : activeRound === 2 ? 'Round 2 · Top 20' : 'Live Evaluation Status'}
              </h1>
              <p className="text-slate-500 mt-2 text-sm font-medium">
                {activeRound === 3
                  ? `${filtered.length} finalists`
                  : activeRound === 2
                  ? `${filtered.length} teams competing · judges scoring live`
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

          {/* ROUND 2 VIEW — Podium top 3 + table for rest */}
          {activeRound === 2 && (
            <>
              {/* Podium (Top 3) */}
              <div className="flex items-end justify-center gap-6 mb-16 w-full max-w-4xl">
                {podiumOrder.map((entry, idx) => {
                  if (!entry) return null
                  const isFirst = entry.rank === 1
                  const heights = { 1: 'h-[300px]', 2: 'h-[250px]', 3: 'h-[220px]' }
                  const cardStyles = {
                    1: { bg: '#F4ECE1', border: '#E83C00', badge: 'bg-[#E83C00] text-white', shadow: 'shadow-2xl shadow-orange-900/10' },
                    2: { bg: '#F4ECE1', border: 'transparent', badge: 'bg-[#EAE4D8] text-slate-700', shadow: 'shadow-xl shadow-black/5' },
                    3: { bg: '#F4ECE1', border: 'transparent', badge: 'bg-amber-100/60 text-amber-900', shadow: 'shadow-xl shadow-black/5' },
                  }
                  const style = cardStyles[entry.rank as keyof typeof cardStyles]
                  return (
                    <motion.div
                      key={entry.teamId}
                      layout
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.15, duration: 0.6, type: 'spring', bounce: 0.4 }}
                      className={`relative flex flex-col items-center p-8 rounded-[2rem] w-1/3 ${heights[entry.rank as keyof typeof heights]} ${style.shadow}`}
                      style={{ backgroundColor: style.bg, border: `2px solid ${style.border}` }}
                    >
                      <div className={`absolute -top-6 px-5 py-2.5 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ${style.badge}`}>
                        {isFirst ? <span className="flex items-center gap-2"><Trophy size={20} /> 1st</span> : `#${entry.rank}`}
                      </div>
                      <div className="mt-8 flex flex-col items-center text-center flex-1 w-full">
                        <Avatar name={entry.teamName} size="lg" className={`mb-4 shadow-md ring-4 ${isFirst ? 'ring-orange-100' : 'ring-white/50'}`} />
                        <h3 className="text-2xl font-black text-[#1A1A1A] mb-1 truncate w-full">{entry.teamName}</h3>
                        <p className="text-slate-500 font-medium text-sm truncate w-full">{entry.college}</p>
                      </div>
                      <div className="w-full pt-4 mt-auto border-t border-black/5 text-center">
                        <motion.div key={entry.totalScore} initial={{ scale: 1.15 }} animate={{ scale: 1 }}
                          className="text-4xl font-black text-[#1A1A1A]">
                          {entry.totalScore.toFixed(1)}
                        </motion.div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Table (Rank 4+) */}
              {restR2.length > 0 && (
                <div className="w-full max-w-5xl rounded-[2rem] bg-[#F4ECE1] shadow-2xl shadow-black/10 overflow-hidden border border-black/5">
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
                      {restR2.map((entry) => (
                        <Round2Row key={entry.teamId} entry={entry} />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ROUND 3 — Winners podium only */}
          {activeRound === 3 && (
            <div className="flex items-end justify-center gap-8 w-full max-w-4xl mt-4">
              {podiumOrder.map((entry, idx) => {
                if (!entry) return null
                const isFirst = entry.rank === 1
                const heights = { 1: 'h-[380px]', 2: 'h-[320px]', 3: 'h-[280px]' }
                const cardStyles = {
                  1: { bg: '#F4ECE1', border: '#E83C00', badge: 'bg-[#E83C00] text-white', shadow: 'shadow-2xl shadow-orange-900/20' },
                  2: { bg: '#F4ECE1', border: 'transparent', badge: 'bg-slate-200 text-slate-700', shadow: 'shadow-xl shadow-black/5' },
                  3: { bg: '#F4ECE1', border: 'transparent', badge: 'bg-amber-100 text-amber-800', shadow: 'shadow-xl shadow-black/5' },
                }
                const style = cardStyles[entry.rank as keyof typeof cardStyles]
                const medals = ['🥇', '🥈', '🥉']
                return (
                  <motion.div
                    key={entry.teamId}
                    layout
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.2, duration: 0.7, type: 'spring', bounce: 0.35 }}
                    className={`relative flex flex-col items-center p-10 rounded-[2.5rem] w-1/3 ${heights[entry.rank as keyof typeof heights]} ${style.shadow}`}
                    style={{ backgroundColor: style.bg, border: `2px solid ${style.border}` }}
                  >
                    <div className={`absolute -top-7 px-6 py-3 rounded-2xl flex items-center gap-2 justify-center font-black text-xl shadow-xl ${style.badge}`}>
                      {isFirst ? (
                        <>
                          <Crown size={22} className="text-amber-300 fill-amber-300/30 stroke-[2.5]" />
                          <span>1st Place</span>
                        </>
                      ) : entry.rank === 2 ? (
                        <>
                          <Medal size={22} className="text-slate-200 stroke-[2.5]" />
                          <span>2nd Place</span>
                        </>
                      ) : (
                        <>
                          <Award size={22} className="text-amber-200 stroke-[2.5]" />
                          <span>3rd Place</span>
                        </>
                      )}
                    </div>
                    <div className="mt-10 flex flex-col items-center text-center flex-1 w-full">
                      <Avatar name={entry.teamName} size="lg" className={`mb-5 shadow-lg ring-4 ${isFirst ? 'ring-orange-200' : 'ring-white/60'}`} />
                      <h3 className="text-3xl font-black text-[#1A1A1A] mb-1 truncate w-full">{entry.teamName}</h3>
                      <p className="text-slate-500 font-medium text-sm truncate w-full">{entry.college}</p>
                    </div>
                    <div className="w-full pt-6 mt-auto border-t border-black/5 text-center">
                      <motion.div key={entry.totalScore} initial={{ scale: 1.2 }} animate={{ scale: 1 }}
                        className="text-5xl font-black text-[#1A1A1A]">
                        {entry.totalScore.toFixed(1)}
                      </motion.div>
                      <p className="text-slate-400 text-xs mt-1 font-medium">Final Score</p>
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
