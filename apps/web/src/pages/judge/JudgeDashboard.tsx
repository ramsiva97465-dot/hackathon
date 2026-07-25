import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Inbox, Clock, CheckCircle, Star, X } from 'lucide-react'
import { api } from '@/lib/api'
import { SCORING_RUBRIC } from '@hackathon/shared'
import { useSession, signOut } from '@/lib/auth-client'
import { Avatar } from '@/components/ui/Avatar'
import { getTrackConfig } from '@/lib/utils'

type Team = {
  id: string
  teamName: string
  college: string
  track: string
  projectTitle: string
  members: { name: string }[]
  isScored: boolean
  isLocked: boolean
  totalScore: number | null
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

function SnapServeLogo() {
  return (
    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0F172A] rounded-xl flex items-center justify-center shadow-sm">
      <img src="/logos/snapserve-mark.svg" alt="SnapServe" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
    </div>
  )
}

function VobizLogo() {
  return (
    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0F172A] rounded-xl flex items-center justify-center shadow-sm">
      <img src="/logos/vobiz-mark.svg" alt="Vobiz" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
    </div>
  )
}

const STAR_COUNT = 5

function starsToPoints(stars: number, max: number) {
  if (stars <= 0) return 0
  return Math.round((stars / STAR_COUNT) * max)
}

function pointsToStars(points: number, max: number) {
  if (!max || points <= 0) return 0
  return Math.min(STAR_COUNT, Math.round((points / max) * STAR_COUNT))
}

function StarScore({
  label,
  max,
  description,
  value,
  onChange,
}: {
  label: string
  max: number
  description: string
  value: number
  onChange: (points: number) => void
}) {
  const [hover, setHover] = useState(0)
  const stars = pointsToStars(value, max)
  const active = hover || stars

  return (
    <div className="rounded-xl border border-[#EAE4D8] bg-white p-3 flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold text-[#1A1A1A]">{label}</p>
        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{description}</p>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div
          className="flex items-center gap-0.5"
          onMouseLeave={() => setHover(0)}
          role="radiogroup"
          aria-label={label}
        >
          {Array.from({ length: STAR_COUNT }, (_, i) => {
            const n = i + 1
            const filled = n <= active
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={n === stars}
                aria-label={`${n} stars`}
                onMouseEnter={() => setHover(n)}
                onClick={() => onChange(starsToPoints(n === stars ? 0 : n, max))}
                className="p-1 rounded-md active:scale-90 transition-transform"
              >
                <Star
                  size={20}
                  className={
                    filled ? 'fill-[#E83C00] text-[#E83C00]' : 'fill-transparent text-slate-300'
                  }
                />
              </button>
            )
          })}
        </div>
        <div className="w-10 text-right">
          <p className="font-mono text-[14px] font-bold text-[#E83C00]">
            {value}
            <span className="text-[10px] text-slate-400 font-medium">/{max}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export function JudgeDashboard() {
  const { data: session } = useSession()
  const [assignedTeams, setAssignedTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string>('')
  
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [scores, setScores] = useState<Record<string, number>>({
    innovation: 0,
    technicalQuality: 0,
    aiUsage: 0,
    businessValue: 0,
    presentation: 0,
  })
  const [submitting, setSubmitting] = useState(false)

  // Reset evaluation state when a different team is selected
  useEffect(() => {
    setIsEvaluating(false)
    setScores({
      innovation: 0,
      technicalQuality: 0,
      aiUsage: 0,
      businessValue: 0,
      presentation: 0,
    })
  }, [selectedId])

  useEffect(() => {
    if (session?.user?.id) {
      fetchTeams(session.user.id)
    }
  }, [session?.user?.id])

  const fetchTeams = async (judgeId: string) => {
    try {
      setLoading(true)
      const res = await api.judges.assignedTeams(judgeId)
      if (res.data?.success) {
        const teams = res.data.data as Team[]
        const sorted = [...teams].sort((a, b) => {
          if (a.isScored === b.isScored) return 0
          return a.isScored ? 1 : -1
        })
        setAssignedTeams(sorted)
        
        if (sorted.length > 0) {
          const firstPending = sorted.find(t => !t.isScored)
          setSelectedId(firstPending ? firstPending.id : sorted[0].id)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/login'
  }

  const scored = assignedTeams.filter(t => t.isScored).length
  const total = assignedTeams.length
  
  const activeTeam = assignedTeams.find(t => t.id === selectedId)
  const track = activeTeam ? getTrackConfig(activeTeam.track) : null

  const totalScore = Object.values(scores).reduce((sum, val) => sum + val, 0)
  const maxPossibleScore = Object.values(SCORING_RUBRIC).reduce((sum, r) => sum + r.max, 0)

  const handleSubmitEvaluation = async () => {
    if (!session?.user?.id || !activeTeam?.id) return
    setSubmitting(true)
    
    const formattedScores = Object.entries(scores)
      .filter(([_, value]) => value !== undefined && !isNaN(value))
      .map(([key, value]) => ({
        criteriaId: key,
        score: value,
      }))

    try {
      await api.scores.submit(activeTeam.id, {
        judgeId: session.user.id,
        scores: formattedScores
      })
      // Refresh teams to get the updated status
      await fetchTeams(session.user.id)
      setIsEvaluating(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen text-[#1A1A1A] selection:bg-[#E83C00]/20 selection:text-[#E83C00] font-sans relative" style={{ backgroundColor: '#EBE3D5' }}>
      {/* Light dotted grid background */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(0,0,0,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-white/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 flex flex-col min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-5 py-6 md:py-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <SnapServeLogo />
              <span className="text-slate-300 font-light mx-0.5">✕</span>
              <VobizLogo />
            </div>
            <div>
              <h1 className="font-display font-bold text-base sm:text-xl tracking-tight text-slate-900 leading-tight">AI Voice Hackathon 2026</h1>
              <p className="text-[9px] sm:text-[11px] text-[#E83C00] font-bold tracking-widest uppercase mt-0.5">Judge Panel</p>
            </div>
          </div>
          <div className="flex items-center justify-between w-full md:w-auto gap-4 pt-4 md:pt-0 border-t border-[#EAE4D8] md:border-t-0">
            <span className="text-xs sm:text-sm font-medium text-slate-500 block">
              Welcome, <span className="text-slate-900 font-bold">{session?.user?.name}</span>
            </span>
            <button onClick={handleSignOut} className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-full border border-[#EAE4D8] hover:bg-white transition-colors bg-white/50 backdrop-blur-sm shadow-sm shrink-0">
              Sign out
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col lg:flex-row gap-6 pb-12">
          
          {/* Left Column: Team List */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between border border-[#EAE4D8] p-4 rounded-2xl shadow-sm" style={{ backgroundColor: '#F4ECE1' }}>
              <div>
                <h2 className="text-sm font-bold text-[#1A1A1A]">Assigned Teams</h2>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Evaluate your queue</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-bold text-[#E83C00]">{scored}/{total}</span>
                <span className="text-[10px] text-slate-400 block uppercase tracking-widest mt-0.5 font-bold">Scored</span>
              </div>
            </div>

            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
              {loading ? (
                <div className="py-12 text-center text-slate-500 text-sm font-medium">Fetching teams...</div>
              ) : assignedTeams.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm flex flex-col items-center border border-dashed border-slate-300 rounded-2xl bg-slate-50/50">
                  <Inbox className="mb-3 text-slate-400" size={32} />
                  No teams assigned to you yet.
                </div>
              ) : (
                assignedTeams.map((team) => {
                  const active = team.id === selectedId
                  return (
                    <motion.div
                      key={team.id}
                      variants={itemVariants}
                      onClick={() => setSelectedId(team.id)}
                      className={`group w-full flex items-center justify-between p-4 rounded-2xl border text-left cursor-pointer transition-all duration-300 ${
                        active 
                          ? 'bg-[#F4ECE1] border-[#E83C00]/40 shadow-[0_10px_25px_rgba(232,60,0,0.08)] ring-1 ring-[#E83C00]/10' 
                          : 'bg-[#F4ECE1] border-[#EAE4D8] hover:bg-white/50 hover:border-[#E83C00]/20 shadow-sm'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-display font-bold text-sm truncate block transition-colors ${active ? 'text-[#E83C00]' : 'text-slate-900'}`}>
                            {team.teamName}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 truncate block font-medium">{team.projectTitle}</span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        {team.isScored ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50/50 border border-orange-200/50">
                            <CheckCircle size={12} className="text-[#E83C00]" />
                            <span className="text-[10px] font-bold text-[#E83C00] font-mono">{team.totalScore?.toFixed(1)}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
                            <Clock size={12} className="text-slate-500" />
                            <span className="text-[10px] font-bold text-slate-600">Pending</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })
              )}
            </motion.div>
          </div>

          {/* Right Column: Preview Panel */}
          <div className={`
            lg:w-[460px] shrink-0
            ${activeTeam ? 'fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm lg:static lg:block lg:bg-transparent lg:p-0 lg:backdrop-blur-none' : 'hidden lg:block'}
          `}>
            {activeTeam && track ? (
              <div className="w-full max-w-lg lg:max-w-none border border-[#EAE4D8] rounded-t-3xl sm:rounded-3xl lg:sticky lg:top-8 shadow-sm flex flex-col overflow-hidden max-h-[90dvh] lg:max-h-[calc(100vh-100px)]" style={{ backgroundColor: '#F4ECE1' }}>
                
                {/* Mobile Close Handle/Button for Preview Mode */}
                {!isEvaluating && (
                  <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preview Team</span>
                    <button onClick={() => setSelectedId('')} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-700 shadow-sm border border-slate-200">
                      <X size={16} />
                    </button>
                  </div>
                )}
                
                {isEvaluating ? (
                  // --- EVALUATION FORM ---
                  <div className="flex flex-col flex-1 min-h-0">
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-[#EAE4D8] shrink-0">
                      <div>
                        <h3 className="font-bold text-[#1A1A1A]">Score sheet</h3>
                        <p className="text-xs text-slate-500 font-medium">Evaluating {activeTeam.teamName}</p>
                      </div>
                      <button 
                        onClick={() => setIsEvaluating(false)}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white/50 rounded-full transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Scrollable Form Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-0">
                      {Object.entries(SCORING_RUBRIC).map(([key, item]) => (
                        <StarScore
                          key={key}
                          label={item.label}
                          description={item.description}
                          max={item.max}
                          value={scores[key] || 0}
                          onChange={(val) => setScores(s => ({ ...s, [key]: val }))}
                        />
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="p-5 border-t border-[#EAE4D8] shrink-0">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-slate-600">Total Score</span>
                        <span className="text-xl font-bold font-mono text-[#E83C00]">
                          {totalScore} <span className="text-sm text-slate-400">/ {maxPossibleScore}</span>
                        </span>
                      </div>
                      <button
                        onClick={handleSubmitEvaluation}
                        disabled={submitting || totalScore === 0}
                        className="w-full py-4 rounded-xl bg-[#E83C00] text-white font-bold text-sm shadow-[0_4px_15px_rgba(232,60,0,0.2)] hover:bg-[#FF4500] hover:shadow-[0_8px_25px_rgba(232,60,0,0.25)] transition-all disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {submitting ? 'Submitting...' : 'Submit Evaluation'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // --- TEAM OVERVIEW ---
                  <div className="flex flex-col p-5 sm:p-6 flex-1 overflow-y-auto">
                    <div className="flex-1 space-y-6">
                      <div className="flex justify-between items-start">
                        <span 
                          className="text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-widest"
                          style={{ background: `${track.color}10`, color: track.color, borderColor: `${track.color}20` }}
                        >
                          {track.label}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h2 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">{activeTeam.teamName}</h2>
                        <p className="text-sm text-slate-500 font-medium">{activeTeam.college}</p>
                      </div>

                      <div className="pt-6 border-t border-slate-100 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Project Overview</span>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">{activeTeam.projectTitle}</p>
                      </div>

                      <div className="pt-6 border-t border-slate-100 space-y-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Team Roster</span>
                        <div className="flex flex-wrap gap-2">
                          {activeTeam.members.map(m => (
                            <div key={m.name} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl hover:border-slate-300 transition-colors">
                              <Avatar name={m.name} size="xs" />
                              <span className="text-xs font-bold text-slate-700">{m.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 mt-8 border-t border-slate-100 shrink-0">
                      {activeTeam.isScored && activeTeam.totalScore !== null ? (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center bg-orange-50/50 border border-orange-100 p-4 rounded-xl">
                            <div>
                              <span className="text-[10px] text-[#E83C00] uppercase tracking-wider block font-bold">Total Score</span>
                              <span className="text-xl font-mono font-bold text-[#E83C00]">{activeTeam.totalScore.toFixed(1)} / 100</span>
                            </div>
                            <CheckCircle size={24} className="text-[#E83C00]" />
                          </div>
                          {!activeTeam.isLocked && (
                            <button 
                              onClick={() => setIsEvaluating(true)}
                              className="w-full py-3.5 rounded-xl border border-slate-200 font-bold text-sm text-slate-700 hover:bg-slate-50 hover:text-[#E83C00] hover:border-slate-300 transition-colors shadow-sm"
                            >
                              Re-Evaluate Submission
                            </button>
                          )}
                        </div>
                      ) : (
                        <button 
                          onClick={() => setIsEvaluating(true)}
                          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#E83C00] text-white hover:bg-[#FF4500] hover:shadow-[0_8px_25px_rgba(232,60,0,0.25)] transition-all font-bold text-sm transform hover:-translate-y-0.5"
                        >
                          Start Evaluation <ArrowUpRight size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : !loading && assignedTeams.length === 0 ? (
              <div className="border border-[#EAE4D8] rounded-3xl p-6 h-[500px] flex flex-col items-center justify-center text-slate-400 shadow-sm" style={{ backgroundColor: '#F4ECE1' }}>
                <Inbox size={48} className="mb-4 text-slate-300" />
                <p className="font-semibold text-slate-500">Queue empty</p>
                <p className="text-xs mt-1 text-center font-medium">Nothing left to score.</p>
              </div>
            ) : null}
          </div>

        </main>
      </div>
    </div>
  )
}

export default JudgeDashboard
