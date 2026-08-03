import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SnapServeMark, VobizMark } from '@/components/brand/BrandLogos'
import { Avatar } from '@/components/ui/Avatar'
import { getTrackConfig } from '@/lib/utils'
import { useWebSocket } from '@/hooks/useWebSocket'
import { TrendingUp, TrendingDown, Minus, Trophy, ChevronRight, Monitor } from 'lucide-react'
import type { LeaderboardEntry } from '@hackathon/shared'

const ROUND2_CUTOFF = 20 // Top 20 advance to round 2

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

// ── Round 1 Row ───────────────────────────────────────────────────────────────
function Round1Row({ entry, isAdvancing }: { entry: LeaderboardEntry; isAdvancing: boolean }) {
  const track = getTrackConfig(entry.track)
  return (
    <motion.div
      key={entry.teamId}
      layout
      layoutId={entry.teamId}
      className={`grid grid-cols-[56px_1fr_160px_90px_100px_60px] px-6 py-3.5 items-center border-b transition-colors ${
        isAdvancing
          ? 'bg-[#F4ECE1] hover:bg-white/60 border-black/5'
          : 'bg-[#EBE3D5]/50 hover:bg-[#EBE3D5] border-black/[0.04]'
      }`}
    >
      {/* Rank */}
      <div className="flex items-center justify-center">
        {isAdvancing ? (
          <span className="text-lg font-black text-[#1A1A1A]">{entry.rank}</span>
        ) : (
          <span className="text-base font-bold text-slate-400">{entry.rank}</span>
        )}
      </div>

      {/* Team */}
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={entry.teamName} size="sm" className={`shrink-0 ring-2 ${isAdvancing ? 'ring-white shadow-sm' : 'ring-white/50'}`} />
        <div className="min-w-0">
          <div className={`font-bold truncate ${isAdvancing ? 'text-slate-900 text-sm' : 'text-slate-500 text-sm'}`}>
            {entry.teamName}
          </div>
          <div className="text-xs text-slate-400 truncate">{entry.college}</div>
        </div>
        {isAdvancing && entry.rank <= ROUND2_CUTOFF && (
          <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-wide hidden sm:inline">
            Top {ROUND2_CUTOFF}
          </span>
        )}
      </div>

      {/* Track */}
      <div>
        <span
          className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold border ${isAdvancing ? 'bg-white shadow-sm' : 'bg-transparent'}`}
          style={{ color: track.color, borderColor: `${track.color}30` }}
        >
          {track.label}
        </span>
      </div>

      {/* Judges */}
      <div className={`text-center font-mono text-xs font-semibold ${isAdvancing ? 'text-slate-600' : 'text-slate-400'}`}>
        {entry.judgeCount > 0 ? '1/1' : '0/1'}
      </div>

      {/* Score */}
      <motion.div
        key={entry.totalScore}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`text-right font-black ${isAdvancing ? 'text-xl text-[#1A1A1A]' : 'text-base text-slate-400'}`}
      >
        {entry.totalScore > 0 ? entry.totalScore.toFixed(1) : '—'}
      </motion.div>

      {/* Delta */}
      <div className="flex justify-end">
        <Delta curr={entry.rank} prev={entry.previousRank} />
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
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [clock, setClock] = useState(new Date())
  const [activeRound, setActiveRound] = useState<number>(1)
  const [manualOverride, setManualOverride] = useState(false)
  const [tvMode, setTvMode] = useState(false)

  const { emit } = useWebSocket<LeaderboardEntry[]>('leaderboard:update', (data) => {
    setEntries(data)
  })

  useEffect(() => { emit('leaderboard:subscribe') }, [emit])
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // TV Mode Auto-scroll logic
  useEffect(() => {
    if (!tvMode) return
    const scrollSpeed = 1
    const interval = setInterval(() => {
      window.scrollBy({ top: scrollSpeed, left: 0, behavior: 'auto' })
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 2) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }, 50)
    return () => clearInterval(interval)
  }, [tvMode])

  // Auto-detect current round from live data
  useEffect(() => {
    if (manualOverride) return
    const rawData = entries
    if (rawData.length === 0) return
    const maxRound = Math.max(...rawData.map(e => (e as any).round || 1))
    setActiveRound(maxRound)
  }, [entries, manualOverride])

  const rawDisplay = entries

  // ── Round-based filtering ──────────────────────────────────────────────────
  // Round 1: ALL teams, sorted by score, top 20 highlighted
  // Round 2: Only promoted teams (round>=2), sorted by new scores
  // Round 3: Only finalists (round=3)
  const filtered = rawDisplay
    .filter(e => {
      const teamRound = (e as any).round || 1
      if (activeRound === 3) return teamRound === 3
      if (activeRound === 2) return teamRound >= 2
      return true // Round 1: show all
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((e, idx) => ({ ...e, rank: idx + 1 }))

  // For Round 2/3 podium
  const top3 = filtered.slice(0, 3)
  const restR2 = filtered.slice(3)
  const podiumOrder = [
    top3.find(e => e.rank === 2),
    top3.find(e => e.rank === 1),
    top3.find(e => e.rank === 3),
  ]

  // For Round 1: split into advancing (top 20) and rest
  const advancing = filtered.slice(0, ROUND2_CUTOFF)
  const notAdvancing = filtered.slice(ROUND2_CUTOFF)

  return (
    <div className="min-h-screen flex flex-col relative" style={{
      backgroundColor: '#EBE3D5',
      backgroundImage: 'radial-gradient(#d4caba 1px, transparent 1px)',
      backgroundSize: '32px 32px',
      fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
    }}>

      {/* ── Top Bar ── */}
      <div className="relative z-10 flex items-center justify-between px-10 py-5 border-b border-black/5 bg-[#EBE3D5]/80 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <SnapServeMark className="h-8 w-8 drop-shadow-sm text-[#1A1A1A]" />
            <span className="text-[#1A1A1A] font-bold text-lg tracking-tight">snapserve.ai</span>
          </div>
          <span className="text-black/10 text-2xl font-light">|</span>
          <div className="flex items-center gap-2">
            <VobizMark className="h-6 w-8 drop-shadow-sm text-[#1A1A1A]" />
            <span className="text-[#1A1A1A] font-bold text-lg tracking-tight">vobiz.ai</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setTvMode(!tvMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all shadow-sm ${
              tvMode 
                ? 'bg-emerald-100 border-emerald-300 text-emerald-700' 
                : 'bg-white/50 border-black/10 text-slate-500 hover:bg-white'
            }`}
            title="Toggle TV Auto-Scroll Mode"
          >
            <Monitor size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{tvMode ? 'TV Mode On' : 'TV Mode'}</span>
          </button>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs font-bold text-orange-600 tracking-widest uppercase">Live</span>
          </div>
          <span className="text-slate-500 font-mono text-lg font-bold tracking-wider">
            {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      {/* ── Main Content ── */}
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
                {activeRound === 3 ? 'Stage 3: Winners Podium' : activeRound === 2 ? 'Stage 2: Top 20 Shortlist' : 'Stage 1: All Teams'}
              </span>
            </div>
            <h2 className="text-[#E83C00] font-bold tracking-[0.2em] uppercase text-sm mb-2">
              AI குரல் · VOICE FOR TAMIL NADU · 2026
            </h2>
            <h1 className="text-6xl font-black text-[#1A1A1A] tracking-tighter" style={{ textShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
              {activeRound === 3 ? 'Final Winners' : activeRound === 2 ? 'Round 2 · Top 20' : 'Live Scoreboard'}
            </h1>
            <p className="text-slate-500 mt-2 text-sm font-medium">
              {activeRound === 3
                ? `${filtered.length} finalists`
                : activeRound === 2
                ? `${filtered.length} teams competing · judges scoring live`
                : `${filtered.length} teams · top ${ROUND2_CUTOFF} advance to Round 2`}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ROUND 1 VIEW — All teams, top 20 highlighted                      */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeRound === 1 && (
          <div className="w-full rounded-[2rem] overflow-hidden shadow-2xl shadow-black/10 border border-black/5">
            {/* Table header */}
            <div className="grid grid-cols-[56px_1fr_160px_90px_100px_60px] px-6 py-4 bg-[#1A1A1A] text-[10px] font-bold text-white/60 uppercase tracking-widest">
              <div className="text-center">Rank</div>
              <div>Team</div>
              <div>Track</div>
              <div className="text-center">Judges</div>
              <div className="text-right">Score</div>
              <div className="text-right">Δ</div>
            </div>

            {/* Advancing zone (Top 20) */}
            <div className="flex flex-col">
              <AnimatePresence>
                {advancing.map((entry) => (
                  <Round1Row key={entry.teamId} entry={entry} isAdvancing={true} />
                ))}
              </AnimatePresence>
            </div>

            {/* ── Cutoff Divider ── */}
            {notAdvancing.length > 0 && (
              <div className="flex items-center gap-3 px-6 py-3 bg-slate-100 border-y border-dashed border-slate-300">
                <div className="flex-1 h-px bg-slate-300" />
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
                  <ChevronRight size={12} className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Round 2 Cutoff — Top {ROUND2_CUTOFF} advance
                  </span>
                  <ChevronRight size={12} className="text-slate-400" />
                </div>
                <div className="flex-1 h-px bg-slate-300" />
              </div>
            )}

            {/* Teams below cutoff */}
            <div className="flex flex-col">
              <AnimatePresence>
                {notAdvancing.map((entry) => (
                  <Round1Row key={entry.teamId} entry={entry} isAdvancing={false} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ROUND 2 VIEW — Podium top 3 + table for rest                      */}
        {/* ══════════════════════════════════════════════════════════════════ */}
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

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ROUND 3 — Winners podium only                                     */}
        {/* ══════════════════════════════════════════════════════════════════ */}
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
    </div>
  )
}

export default LeaderboardPage
