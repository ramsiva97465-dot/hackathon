import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { SnapServeMark, VobizMark } from '@/components/brand/BrandLogos'
import { Avatar } from '@/components/ui/Avatar'
import { getTrackConfig } from '@/lib/utils'
import { useWebSocket } from '@/hooks/useWebSocket'
import { 
  TrendingUp, TrendingDown, Minus, Trophy, ChevronRight, Monitor,
  Play, Pause, SkipForward, RotateCcw, Volume2, VolumeX, Sparkles, Star, CheckCircle2, Lock, Flame, Zap, Award, Crown, Medal
} from 'lucide-react'
import type { LeaderboardEntry } from '@hackathon/shared'
import api from '@/lib/api'

const ROUND2_CUTOFF = 20 // Top 20 advance to round 2

// ── Web Audio Synth for Dramatic Reveal Fanfares ──────────────────────────────
function playRevealChime(rank: number) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    const isGold = rank === 1
    const isSilver = rank === 2
    const isBronze = rank === 3
    const isTop10 = rank <= 10

    const freqs = isGold 
      ? [523.25, 659.25, 783.99, 1046.50, 1318.51] // High C Major fanfare
      : isSilver 
      ? [440.00, 554.37, 659.25, 880.00] // A Major
      : isBronze 
      ? [392.00, 493.88, 587.33, 783.99] // G Major
      : isTop10 
      ? [329.63, 392.00, 493.88] // E minor chord
      : [261.63, 329.63, 392.00] // C major chord

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = isGold ? 'triangle' : 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09)
      
      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.09)
      gain.gain.linearRampToValueAtTime(isGold ? 0.28 : 0.16, ctx.currentTime + idx * 0.09 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.09 + (isGold ? 1.4 : 0.65))
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + idx * 0.09)
      osc.stop(ctx.currentTime + idx * 0.09 + (isGold ? 1.5 : 0.7))
    })
  } catch (e) {
    // Audio may be muted by browser policy before first user interaction
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
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider">
            Evaluated
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
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
  // revealedStep goes from 0 up to 20.
  // Step 1 reveals Rank 20. Step 20 reveals Rank 1.
  const [isRevealing, setIsRevealing] = useState<boolean>(searchParams.get('reveal') === 'true')
  const [revealedStep, setRevealedStep] = useState<number>(0)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)
  const timerRef = useRef<any>(null)
  const rosterRef = useRef<HTMLDivElement>(null)

  const { emit } = useWebSocket<LeaderboardEntry[]>('leaderboard:update', (data) => {
    setEntries(data)
  })

  // Listen for broadcasted reveal triggers from admin panel
  useWebSocket<{ round?: number; type?: string }>('leaderboard:reveal_start', () => {
    startGrandReveal()
  })

  useWebSocket<{ isRevealing: boolean }>('leaderboard:reveal_stop', () => {
    stopGrandReveal()
  })

  useWebSocket<{ isRevealing: boolean; round?: number }>('leaderboard:reveal_state', (data) => {
    if (data?.isRevealing) {
      startGrandReveal()
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
        if (!isRevealing) startGrandReveal()
      } else if (res.data && !res.data.isRevealing && isRevealing && !searchParams.get('reveal')) {
        stopGrandReveal()
      }
    } catch (err) {
      // Ignore
    }
  }

  useEffect(() => { emit('leaderboard:subscribe') }, [emit])

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
      startGrandReveal()
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

  // Auto-detect current round from live data
  useEffect(() => {
    if (manualOverride || isRevealing) return
    const rawData = entries
    if (rawData.length === 0) return
    const maxRound = Math.max(...rawData.map(e => (e as any).round || 1))
    setActiveRound(maxRound)
  }, [entries, manualOverride, isRevealing])

  const rawDisplay = entries

  // ── Round-based filtering ──────────────────────────────────────────────────
  const filtered = rawDisplay
    .filter(e => {
      const teamRound = (e as any).round || 1
      if (activeRound === 3) return teamRound === 3
      if (activeRound === 2) return teamRound >= 2
      return true // Round 1: show all
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((e, idx) => ({ ...e, rank: idx + 1 }))

  // Advancing Top 20 (sorted 1 to 20)
  const advancing = filtered.slice(0, ROUND2_CUTOFF)
  const notAdvancing = filtered.slice(ROUND2_CUTOFF)

  // ── Grand Reveal Logic (Countdown 20 ➔ 1) ──────────────────────────────────
  const startGrandReveal = () => {
    setIsRevealing(true)
    setRevealedStep(0)
    setIsPaused(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const stopGrandReveal = () => {
    setIsRevealing(false)
    setRevealedStep(20)
    searchParams.delete('reveal')
    setSearchParams(searchParams, { replace: true })
  }

  const stepNextReveal = () => {
    setRevealedStep(prev => {
      const next = Math.min(20, prev + 1)
      const currentRank = 21 - next
      if (soundEnabled) {
        playRevealChime(currentRank)
      }
      return next
    })
  }

  // Auto-scroll to Roster + slow-scroll through all teams once all 20 are revealed
  useEffect(() => {
    if (!isRevealing || revealedStep < 20) return

    // Step 1: After 2.5s, scroll to the roster grid
    const scrollToRoster = setTimeout(() => {
      rosterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 2500)

    // Step 2: After 3.5s (roster is in view), start slow continuous scroll through it
    let slowScrollInterval: ReturnType<typeof setInterval> | null = null
    const startSlowScroll = setTimeout(() => {
      slowScrollInterval = setInterval(() => {
        // Scroll down 1px at a time for smooth effect
        window.scrollBy({ top: 1, behavior: 'auto' })

        // Stop when we've reached the very bottom of the page
        const atBottom = (window.innerHeight + Math.ceil(window.scrollY)) >= document.body.offsetHeight - 10
        if (atBottom && slowScrollInterval) {
          clearInterval(slowScrollInterval)
        }
      }, 30) // 30ms interval = ~33px/sec — slow enough to read every team
    }, 3500)

    return () => {
      clearTimeout(scrollToRoster)
      clearTimeout(startSlowScroll)
      if (slowScrollInterval) clearInterval(slowScrollInterval)
    }
  }, [isRevealing, revealedStep])

  // Automatic Reveal Step Timer (2.3 seconds delay for suspense)
  useEffect(() => {
    if (!isRevealing || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    timerRef.current = setInterval(() => {
      setRevealedStep(prev => {
        if (prev >= advancing.length || prev >= 20) {
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
    }, 2400)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRevealing, isPaused, advancing.length, soundEnabled])

  // Current spotlight team during countdown
  // At step 1 -> rank 20 -> advancing[19]
  // At step 20 -> rank 1 -> advancing[0]
  const currentSpotlightRank = 21 - revealedStep
  const currentSpotlightTeam = revealedStep > 0 && revealedStep <= advancing.length 
    ? advancing[20 - revealedStep] 
    : null

  // For Round 2/3 podium
  const top3 = filtered.slice(0, 3)
  const restR2 = filtered.slice(3)
  const podiumOrder = [
    top3.find(e => e.rank === 2),
    top3.find(e => e.rank === 1),
    top3.find(e => e.rank === 3),
  ]

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
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <SnapServeMark className="h-8 w-8 drop-shadow-sm text-[#1A1A1A]" />
            <span className="font-bold text-lg tracking-tight">snapserve.ai</span>
          </div>
          <span className="opacity-20 text-2xl font-light">|</span>
          <div className="flex items-center gap-2">
            <VobizMark className="h-6 w-8 drop-shadow-sm text-[#1A1A1A]" />
            <span className="font-bold text-lg tracking-tight">vobiz.ai</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Close button only visible when reveal mode is currently active */}
          {isRevealing && (
            <button
              onClick={stopGrandReveal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-300 transition-all shadow-sm cursor-pointer"
              title="Exit Grand Reveal"
            >
              <span>✕ Exit Announcement</span>
            </button>
          )}

          {/* Active TV Mode Indicator (Controlled by Admin Panel) */}
          {!isRevealing && tvMode && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 shadow-sm animate-pulse">
              <Monitor size={13} className="text-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">TV Auto-Scroll</span>
            </div>
          )}

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[11px] font-extrabold text-orange-500 tracking-widest uppercase">Live</span>
          </div>

          <span className="font-mono text-base sm:text-lg font-bold tracking-wider text-slate-600">
            {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 🎭 DRAMATIC GRAND REVEAL CEREMONY (Countdown: 20 ➔ 1)                */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {isRevealing ? (
        <div className="relative z-10 flex-1 flex flex-col items-center pt-8 pb-24 px-4 sm:px-6 max-w-6xl mx-auto w-full">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/5 text-slate-700 mb-3 shadow-xl shadow-black/5">
              <Trophy size={14} className="text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Round 2 Qualifiers · Live Ceremony
              </span>
            </div>
            <h2 className="text-[#E83C00] font-bold tracking-[0.2em] uppercase text-sm mb-2">
              AI குரல் · VOICE FOR TAMIL NADU · 2026
            </h2>
            <h1 className="text-5xl sm:text-6xl font-black text-[#1A1A1A] tracking-tighter" style={{ textShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
              Top 20 Grand Reveal
            </h1>
            <p className="text-slate-500 mt-2 text-sm sm:text-base font-medium">
              Revealing advancing finalists in live countdown order: <span className="text-[#E83C00] font-bold">#20 ➔ #1</span>
            </p>
          </motion.div>


          {/* 🌟 HERO SPOTLIGHT ANNOUNCEMENT CARD */}
          <div className="w-full max-w-3xl mb-10">
            <AnimatePresence mode="wait">
              {revealedStep === 0 ? (
                <motion.div
                  key="ready-state"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#F4ECE1] border-2 border-black/10 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-black/10 text-center relative overflow-hidden"
                >
                  <div className="w-20 h-20 rounded-3xl bg-[#E83C00]/10 border border-[#E83C00]/20 flex items-center justify-center mx-auto mb-4 text-[#E83C00] shadow-sm">
                    <Trophy size={38} />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] mb-2">
                    Round 1 Graded & Verified!
                  </h3>
                  <p className="text-slate-500 max-w-lg mx-auto text-sm sm:text-base mb-6 font-medium">
                    The ceremony will announce all 20 qualifying teams one by one, counting down from Rank #20 down to the #1 Leader!
                  </p>
                  <button
                    onClick={stepNextReveal}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#E83C00] hover:bg-[#c93400] text-white rounded-2xl font-black text-sm shadow-xl shadow-orange-950/20 cursor-pointer transition-all hover:scale-105"
                  >
                    <Play size={15} fill="white" />
                    Start Announcement (#20)
                  </button>
                </motion.div>
              ) : currentSpotlightTeam ? (
                <motion.div
                  key={`spotlight-${currentSpotlightRank}-${currentSpotlightTeam.teamId}`}
                  initial={{ opacity: 0, scale: 0.85, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.05, y: -20 }}
                  transition={{ type: 'spring', bounce: 0.35, duration: 0.65 }}
                  className="relative p-7 sm:p-10 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/10 text-center border-2 bg-[#F4ECE1]"
                  style={{
                    borderColor: currentSpotlightRank === 1
                      ? '#E83C00'
                      : currentSpotlightRank === 2
                      ? '#64748B'
                      : currentSpotlightRank === 3
                      ? '#D97706'
                      : '#10B981'
                  }}
                >
                  {/* Announcement Tag */}
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 shadow-sm"
                    style={{
                      backgroundColor: currentSpotlightRank === 1 ? '#E83C00' : currentSpotlightRank === 2 ? '#64748B' : currentSpotlightRank === 3 ? '#D97706' : '#10B981',
                      color: '#FFFFFF'
                    }}>
                    {currentSpotlightRank === 1 ? <Crown size={14} /> : currentSpotlightRank <= 3 ? <Medal size={14} /> : <CheckCircle2 size={14} />}
                    <span>{currentSpotlightRank === 1 ? '🥇 1st Place Finalist' : currentSpotlightRank === 2 ? '🥈 2nd Place Finalist' : currentSpotlightRank === 3 ? '🥉 3rd Place Finalist' : '⭐ Qualified For Round 2'}</span>
                  </div>

                  {/* Giant Rank */}
                  <div className="text-6xl sm:text-7xl font-black mb-3 tracking-tighter"
                    style={{
                      color: currentSpotlightRank === 1 ? '#E83C00' : currentSpotlightRank === 2 ? '#334155' : currentSpotlightRank === 3 ? '#B45309' : '#047857'
                    }}>
                    RANK #{currentSpotlightRank}
                  </div>

                  {/* Team Name */}
                  <h2 className="text-3xl sm:text-5xl font-black text-[#1A1A1A] tracking-tight mb-2 truncate px-4">
                    {currentSpotlightTeam.teamName}
                  </h2>

                  {/* College & Track */}
                  <div className="flex items-center justify-center gap-2.5 flex-wrap text-slate-600 text-sm sm:text-base font-medium mb-6">
                    <span>{currentSpotlightTeam.college || 'Tamil Nadu'}</span>
                    <span className="text-slate-400">•</span>
                    <span className="px-3 py-1 rounded-lg bg-white text-slate-800 text-xs font-bold border border-black/10 shadow-sm">
                      {getTrackConfig(currentSpotlightTeam.track).label}
                    </span>
                  </div>

                  {/* Round 1 Score */}
                  <div className="inline-flex items-center gap-3 px-7 py-3 rounded-2xl bg-white border border-black/10 shadow-sm">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Round 1 Score</span>
                    <span className="text-2xl sm:text-3xl font-black text-[#1A1A1A] font-mono">
                      {currentSpotlightTeam.totalScore.toFixed(1)}
                    </span>
                  </div>

                  {/* Progress Indicator */}
                  <div className="mt-7 pt-4 border-t border-black/10 flex items-center justify-between text-xs text-slate-500 font-semibold px-2">
                    <span>Progress: {revealedStep} of 20 revealed</span>
                    <span className="text-[#E83C00] font-bold">
                      {revealedStep === 20 ? '🎉 All Finalists Revealed!' : `Next: Rank #${currentSpotlightRank - 1}`}
                    </span>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TOP 20 QUALIFIER BOARD (Rank 1 to 20 Grid)                         */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          <div ref={rosterRef} className="w-full bg-[#F4ECE1] border border-black/10 rounded-[2.5rem] p-5 sm:p-7 shadow-2xl shadow-black/10 overflow-hidden">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-black/10">
              <div className="flex items-center gap-2.5">
                <Trophy size={18} className="text-amber-500" />
                <h3 className="text-lg font-black text-[#1A1A1A]">Round 2 Qualifiers Roster</h3>
              </div>
              <span className="text-xs font-bold text-emerald-800 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300">
                {revealedStep} / {Math.min(20, advancing.length)} Unlocked
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: Math.min(20, advancing.length || 20) }).map((_, idx) => {
                const rankNum = idx + 1 // 1 to 20
                const team = advancing[idx]
                const isRevealed = rankNum >= (21 - revealedStep)
                const isSpotlight = rankNum === currentSpotlightRank && revealedStep > 0

                return (
                  <motion.div
                    key={`slot-${rankNum}`}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`flex items-center justify-between p-3.5 rounded-2xl transition-all border ${
                      isSpotlight
                        ? 'bg-[#E83C00]/15 border-[#E83C00] ring-2 ring-[#E83C00]/40 shadow-xl shadow-orange-950/10 scale-[1.02]'
                        : isRevealed
                        ? 'bg-white border-black/5 hover:border-black/15 shadow-sm'
                        : 'bg-[#EBE3D5]/50 border-black/[0.04] opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank number badge */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        rankNum === 1
                          ? 'bg-[#E83C00] text-white font-extrabold shadow-sm'
                          : rankNum === 2
                          ? 'bg-slate-300 text-slate-900 font-extrabold'
                          : rankNum === 3
                          ? 'bg-amber-200 text-amber-900 font-extrabold'
                          : isRevealed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-200 text-slate-400'
                      }`}>
                        #{rankNum}
                      </div>

                      {isRevealed && team ? (
                        <div className="min-w-0">
                          <p className="text-sm font-black text-[#1A1A1A] truncate flex items-center gap-1.5">
                            <span>{team.teamName}</span>
                            {rankNum <= 3 && <span>{rankNum === 1 ? '🥇' : rankNum === 2 ? '🥈' : '🥉'}</span>}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate font-medium">{team.college}</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400">
                          <Lock size={12} className="animate-pulse" />
                          <span className="text-xs font-semibold tracking-wide">Locked & Pending...</span>
                        </div>
                      )}
                    </div>

                    {/* Right side info */}
                    {isRevealed && team ? (
                      <div className="text-right shrink-0 pl-2">
                        <span className="text-sm font-black text-[#1A1A1A] font-mono">{team.totalScore.toFixed(1)}</span>
                        <span className="block text-[9px] font-bold uppercase text-emerald-600">Qualified</span>
                      </div>
                    ) : (
                      <div className="w-12 h-4 rounded bg-slate-200/50 animate-pulse shrink-0" />
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
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
                      <span>{medals[idx]}</span>
                      {isFirst ? '1st Place' : entry.rank === 2 ? '2nd Place' : '3rd Place'}
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
