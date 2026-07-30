import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  Trophy, Users, BookOpen, FileText, Star, LogOut, Save,
  Instagram, Linkedin, CheckCircle2, Clock, RefreshCw,
  ChevronRight, ChevronDown, Home, Award, ExternalLink, Medal, Bell, Megaphone, Plus, Trash2, User
} from 'lucide-react'
import { BrandLockup } from '@/components/brand/BrandLogos'
import { LanyardBadge } from '@/components/ui/LanyardBadge'

// ─── Types ──────────────────────────────────────────────────────────────────

type TeamDetails = {
  id: string
  name: string
  tableNumber: string | null
  track: { name: string; slug: string }
  projectTitle: string | null
  projectDescription: string | null
  agentName: string | null
  agentSolution: string | null
  agentPhoneNumber: string | null
  githubUrl: string | null
  demoUrl: string | null
  techStack: string[]
  followedInstagram: boolean
  followedLinkedin: boolean
  bonusPoints: number
  round: number
  members: { id?: string; name: string; email: string; role: string; linkedin?: string; github?: string }[]
  evaluation: {
    submittedSheetsCount: number
    overallScore: number | null
    rank: number | null
    criteria: {
      id: string
      name: string
      maxScore: number
      avgScore: number | null
    }[]
  }
}

type LeaderboardEntry = {
  rank: number
  teamId: string
  teamName: string
  track: string
  overallScore: number
  judgeCount: number
}

// ─── Tab Config ──────────────────────────────────────────────────────────────

type Tab = 'home' | 'playbook' | 'submission' | 'bonus' | 'leaderboard'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'home',        label: 'Home',        icon: <Home size={16} /> },
  { id: 'playbook',   label: 'Playbook',    icon: <BookOpen size={16} /> },
  { id: 'submission', label: 'Submission',  icon: <FileText size={16} /> },
  { id: 'bonus',      label: 'Bonus Pts',   icon: <Star size={16} /> },
  { id: 'leaderboard',label: 'Leaderboard', icon: <Trophy size={16} /> },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ROUND_LABELS: Record<number, string> = { 1: 'Round 1', 2: 'Round 2', 3: 'Finals' }
const ROUND_COLORS: Record<number, string> = {
  1: 'bg-blue-500/10 text-blue-600 border-blue-200',
  2: 'bg-orange-500/10 text-orange-600 border-orange-200',
  3: 'bg-amber-500/10 text-amber-600 border-amber-200',
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function RoundBadge({ round }: { round: number }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${ROUND_COLORS[round] || ROUND_COLORS[1]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
      {ROUND_LABELS[round] || `Round ${round}`}
    </span>
  )
}

function TabButton({ tab, active, onClick }: { tab: typeof TABS[0]; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all flex-1 md:flex-none md:flex-row md:gap-2.5 md:px-3 md:py-2.5 md:w-full ${
        active
          ? 'bg-[#E83C00] text-white shadow-md shadow-[#E83C00]/20'
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
      }`}
    >
      <span className={`${active ? 'text-white' : 'text-current'}`}>{tab.icon}</span>
      <span className={`text-[9px] md:text-[11px] font-bold tracking-wide ${active ? '' : ''}`}>{tab.label}</span>
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ParticipantDashboard() {
  const [data, setData] = useState<TeamDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('home')

  // Form state
  const [projectTitle, setProjectTitle] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [agentName, setAgentName] = useState('')
  const [agentSolution, setAgentSolution] = useState('')
  const [agentPhoneNumber, setAgentPhoneNumber] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [demoUrl, setDemoUrl] = useState('')
  const [techStackText, setTechStackText] = useState('')
  const [saving, setSaving] = useState(false)
  const [membersForm, setMembersForm] = useState<{ id?: string; name: string; email: string; role?: string; linkedin?: string; github?: string }[]>([])

  // Bonus state
  const [followedInstagram, setFollowedInstagram] = useState(false)
  const [followedLinkedin, setFollowedLinkedin] = useState(false)
  const [savingBonus, setSavingBonus] = useState(false)

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [lbRound, setLbRound] = useState(1)
  const [lbLoading, setLbLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Announcements state
  const [announcements, setAnnouncements] = useState<{ id: string; message: string; createdAt: string }[]>([])

  // Help Request state
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const [helpIssueType, setHelpIssueType] = useState('Technical Issue')
  const [helpDescription, setHelpDescription] = useState('')
  const [submittingHelp, setSubmittingHelp] = useState(false)

  const handleRequestHelp = async () => {
    if (!data?.id) return
    setSubmittingHelp(true)
    try {
      await api.helpRequests.create({
        teamId: data.id,
        issueType: helpIssueType,
        description: helpDescription,
      })
      toast.success('Mentor request submitted! A mentor will arrive at your table shortly.')
      setHelpModalOpen(false)
      setHelpDescription('')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit mentor request')
    } finally {
      setSubmittingHelp(false)
    }
  }

  // UI State
  const [membersExpanded, setMembersExpanded] = useState(false)
  const [isEditingSubmission, setIsEditingSubmission] = useState(false)
  const [showNameConfirmModal, setShowNameConfirmModal] = useState(false)
  const [activeMemberPassIndex, setActiveMemberPassIndex] = useState(0)

  // ── Fetchers ────────────────────────────────────────────────────────────────

  const fetchMyTeam = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const res = await api.teams.myTeam()
      if (res.data?.success) {
        const team = res.data.data as TeamDetails
        setData(team)
        
        // Only populate form fields on initial load / explicit refresh, NEVER during background polling
        if (!silent) {
          setProjectTitle(team.projectTitle || '')
          setProjectDescription(team.projectDescription || '')
          setAgentName(team.agentName || '')
          setAgentSolution(team.agentSolution || '')
          setAgentPhoneNumber(team.agentPhoneNumber || '')
          setGithubUrl(team.githubUrl || '')
          setDemoUrl(team.demoUrl || '')
          setTechStackText(team.techStack ? team.techStack.join(', ') : '')
          setFollowedInstagram(team.followedInstagram)
          setFollowedLinkedin(team.followedLinkedin)
          
          // Populate members
          if (team.members && team.members.length > 0) {
            setMembersForm(team.members.map(m => ({
              id: m.id,
              name: m.name,
              email: m.email,
              role: m.role || '',
              linkedin: m.linkedin || '',
              github: m.github || ''
            })))
          } else {
            setMembersForm([{ name: '', email: '', linkedin: '', github: '' }])
          }
        }
      }
    } catch (err) {
      console.error(err)
      if (!silent) toast.error('Failed to load team data.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  const fetchLeaderboard = useCallback(async (round: number) => {
    try {
      setLbLoading(true)
      const res = await api.leaderboard.get({ round })
      if (Array.isArray(res.data)) {
        setLeaderboard(res.data)
        setLastRefresh(new Date())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLbLoading(false)
    }
  }, [])

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await api.announcements.getActive()
      if (res.data) {
        setAnnouncements(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch announcements', err)
    }
  }, [])

  useEffect(() => { 
    fetchMyTeam()
    fetchAnnouncements()

    const teamInterval = setInterval(() => fetchMyTeam(true), 10_000)
    return () => clearInterval(teamInterval)
  }, [fetchMyTeam, fetchAnnouncements])

  useEffect(() => {
    const interval = setInterval(fetchAnnouncements, 10_000)
    return () => clearInterval(interval)
  }, [fetchAnnouncements])

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard(lbRound)
      const interval = setInterval(() => fetchLeaderboard(lbRound), 30_000)
      return () => clearInterval(interval)
    }
  }, [activeTab, lbRound, fetchLeaderboard])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const generateCertificate = () => {
    if (!data) return
    const certWindow = window.open('', '_blank')
    if (!certWindow) return
    certWindow.document.write(`
      <html>
        <head>
          <title>Certificate of Participation</title>
          <style>
            body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #333; font-family: sans-serif; }
            .cert { width: 800px; height: 600px; background: white; padding: 40px; box-sizing: border-box; text-align: center; position: relative; border: 10px solid #E83C00; border-radius: 10px; }
            h1 { color: #E83C00; font-size: 48px; margin-top: 50px; text-transform: uppercase; letter-spacing: 2px; }
            h2 { color: #555; font-size: 24px; font-weight: normal; margin-top: 20px; }
            h3 { color: #222; font-size: 36px; margin-top: 40px; margin-bottom: 40px; }
            p { font-size: 18px; color: #666; line-height: 1.6; }
            .footer { position: absolute; bottom: 50px; width: calc(100% - 80px); display: flex; justify-content: space-between; }
            .sig { border-top: 2px solid #222; padding-top: 10px; width: 200px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="cert">
            <h1>Certificate of Participation</h1>
            <h2>This is proudly presented to</h2>
            <h3>${data.name}</h3>
            <p>For outstanding performance and dedication in the<br/><b>AI Voice Agent Hackathon 2026</b><br/>Track: ${data.track.name}</p>
            <div class="footer">
              <div class="sig">Organizer</div>
              <div class="sig">Lead Judge</div>
            </div>
          </div>
          <script>
            window.onload = () => window.print();
          </script>
        </body>
      </html>
    `)
    certWindow.document.close()
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!data) return

    if (!agentPhoneNumber || agentPhoneNumber.trim() === '') {
      toast.error('Agent Phone Number is required for the Voice-a-thon live demo.')
      return
    }

    try {
      setSaving(true)
      const techStack = techStackText.split(',').map(t => t.trim()).filter(Boolean)
      
      // Basic validation for members
      const validMembers = membersForm.filter(m => m.name.trim() !== '' && m.email.trim() !== '')
      if (validMembers.length === 0) {
        toast.error('At least one team member is required.')
        setSaving(false)
        return
      }

      const res = await api.teams.submitProject({
        projectTitle, projectDescription, agentName, agentSolution, agentPhoneNumber,
        githubUrl, demoUrl, techStack,
        followedInstagram, followedLinkedin,
        members: validMembers.map((m, idx) => ({
          ...m,
          role: idx === 0 ? 'TEAM_LEAD' : 'TEAM_MEMBER'
        })),
      })
      if (res.data?.success) {
        toast.success('Project details saved!')
        setIsEditingSubmission(false)
        setShowNameConfirmModal(false)
        fetchMyTeam()
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const handleBonusToggle = async (platform: 'instagram' | 'linkedin', value: boolean) => {
    const newInsta = platform === 'instagram' ? value : followedInstagram
    const newLinkedin = platform === 'linkedin' ? value : followedLinkedin
    if (platform === 'instagram') setFollowedInstagram(value)
    else setFollowedLinkedin(value)

    try {
      setSavingBonus(true)
      await api.teams.submitProject({
        followedInstagram: newInsta,
        followedLinkedin: newLinkedin,
      })
      toast.success(value ? 'Bonus point claimed! Pending admin verification.' : 'Bonus point claim removed.')
      fetchMyTeam()
    } catch (err) {
      console.error(err)
      toast.error('Failed to update bonus.')
    } finally {
      setSavingBonus(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('participant_token')
    localStorage.removeItem('auth_token')
    window.location.href = '/login'
  }

  // ── Loading / Error States ───────────────────────────────────────────────────

  if (loading && !data) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#080D18',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '36px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,60,0,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <motion.div
          style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" style={{ height: '44px', width: '44px' }}>
            <motion.rect width="32" height="32" rx="7" fill="#0a0a0a"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} />
            <motion.rect x="3" y="5.5" width="17" height="4.5" rx="2.25" fill="#52525b"
              initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} />
            <motion.rect x="7" y="12.5" width="17" height="4.5" rx="2.25" fill="#a1a1aa"
              initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }} />
            <motion.rect x="11" y="19.5" width="17" height="4.5" rx="2.25" fill="#e4e4e7"
              initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }} />
          </svg>

          <motion.span
            style={{
              fontSize: '26px',
              fontWeight: 600,
              color: '#F8FAFC',
              letterSpacing: '-1px',
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              userSelect: 'none',
            }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.75, ease: 'easeOut' }}
          >
            Snapserve
          </motion.span>
        </motion.div>

        <motion.div
          style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.4 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#E83C00',
                boxShadow: '0 0 8px rgba(232,60,0,0.7)',
              }}
              animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1.2, 0.8] }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                delay: i * 0.22,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F5F0E8' }}>
        <div className="bg-white p-8 rounded-2xl border max-w-sm text-center shadow-sm">
          <Award size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-sm font-semibold text-slate-500 mb-4">No team found for your account.</p>
          <button onClick={handleLogout} className="px-5 py-2.5 bg-[#E83C00] text-white text-xs font-bold rounded-xl">
            Logout
          </button>
        </div>
      </div>
    )
  }

  const bonusPoints = (followedInstagram ? 1 : 0) + (followedLinkedin ? 1 : 0)

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F0E8', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur-md border-slate-200/60 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BrandLockup tone="light" />
            <div className="h-5 w-px bg-slate-200 hidden sm:block" />
            <div className="hidden sm:block">
              <p className="text-[10px] font-bold text-[#E83C00] uppercase tracking-widest leading-none">Participant Portal</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{data.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RoundBadge round={data.round} />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-100"
            >
              <LogOut size={11} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Announcements Banner ── */}
      {announcements.length > 0 && (
        <div className="bg-[#E83C00] text-white border-b border-[#c93400] relative z-20 shadow-md">
          <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">
            <Megaphone size={16} className="shrink-0 animate-pulse text-orange-200" />
            <div className="flex-1 overflow-hidden relative">
              {announcements.length === 1 ? (
                <p className="text-xs font-bold truncate">{announcements[0].message}</p>
              ) : (
                <div className="flex animate-[marquee_20s_linear_infinite] whitespace-nowrap gap-12">
                  {announcements.concat(announcements).map((ann, i) => (
                    <p key={`${ann.id}-${i}`} className="text-xs font-bold inline-block">
                      {ann.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Layout ── */}
      <div className="flex flex-1 max-w-6xl mx-auto w-full px-4 py-6 gap-6 lg:gap-10">

        {/* Desktop Sidebar Nav */}
        <aside className="hidden md:flex flex-col gap-1 w-48 shrink-0 pt-1">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Menu</p>
          {TABS.map(tab => (
            <TabButton key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
          ))}

          {/* Bonus Points Chip */}
          <div className="mt-6 mx-1 p-4 rounded-xl border border-amber-200 bg-amber-50 text-center shadow-sm">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Bonus Points</p>
            <p className="text-3xl font-black text-amber-700 mt-1">{bonusPoints}<span className="text-sm font-bold opacity-60">/2</span></p>
          </div>

        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 pb-24 md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-5"
            >

              {/* ── HOME TAB ── */}
              {activeTab === 'home' && (
                <>
                  {/* Team Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-[#E83C00] uppercase tracking-widest">{data.track.name}</span>
                        <h1 className="text-xl font-black text-slate-900 mt-0.5 leading-tight">{data.name}</h1>
                        <p className="text-xs text-slate-400 mt-0.5">{data.members.length} members</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Table</p>
                        <p className="text-3xl font-black text-slate-800">{data.tableNumber || '—'}</p>
                      </div>
                    </div>

                    {/* Members */}
                    <div className="px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setMembersExpanded(!membersExpanded)}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Team Members</p>
                        <ChevronDown className={`text-slate-400 transition-transform duration-200 ${membersExpanded ? 'rotate-180' : ''}`} size={16} />
                      </div>
                      <AnimatePresence initial={false}>
                        {membersExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                              {data.members.map((m, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E83C00] to-orange-400 flex items-center justify-center font-black text-white text-xs shrink-0">
                                    {m.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-800 truncate">{m.name}</p>
                                    <p className="text-[10px] text-slate-400 truncate">{m.email}</p>
                                  </div>
                                  <span className="ml-auto shrink-0 text-[8px] font-extrabold bg-[#E83C00]/10 text-[#E83C00] border border-[#E83C00]/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                    {i === 0 ? 'TEAM LEAD' : 'TEAM MEMBER'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Leaderboard Preview */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Trophy className="text-[#E83C00]" size={16} />
                        <h2 className="text-sm font-black text-slate-900">Top Teams (Round {lbRound})</h2>
                      </div>
                      <button onClick={() => fetchLeaderboard(lbRound)} disabled={lbLoading} className="text-slate-400 hover:text-[#E83C00] transition-colors disabled:opacity-50">
                        <RefreshCw size={14} className={lbLoading ? 'animate-spin' : ''} />
                      </button>
                    </div>
                    <div className="p-4 space-y-2">
                      {leaderboard.slice(0, 3).map((entry) => (
                        <div key={entry.teamId} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${entry.rank === 1 ? 'bg-amber-100 text-amber-700' : entry.rank === 2 ? 'bg-slate-200 text-slate-600' : entry.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-white text-slate-400'}`}>
                            #{entry.rank}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate">{entry.teamName}</p>
                            <p className="text-[9px] text-slate-400 truncate">{entry.track}</p>
                          </div>
                          <div className="text-xs font-black text-slate-800">{entry.overallScore.toFixed(1)}</div>
                        </div>
                      ))}
                      {leaderboard.length > 3 && data.evaluation.rank && data.evaluation.rank > 3 && (
                        <>
                          <div className="flex justify-center py-1">
                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#E83C00]/5 border border-[#E83C00]/20">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black bg-[#E83C00] text-white">
                              #{data.evaluation.rank}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-800 truncate">You ({data.name})</p>
                              <p className="text-[9px] text-slate-400 truncate">{data.track.name}</p>
                            </div>
                            <div className="text-xs font-black text-[#E83C00]">{data.evaluation.overallScore?.toFixed(1) || '0.0'}</div>
                          </div>
                        </>
                      )}
                      {leaderboard.length === 0 && !lbLoading && (
                        <p className="text-xs text-center text-slate-400 py-4">No scores yet</p>
                      )}
                    </div>
                  </div>

                  {/* Quick nav to submission */}
                  <button
                    onClick={() => setActiveTab('submission')}
                    className="w-full flex items-center justify-between p-4 bg-[#E83C00] text-white rounded-2xl shadow-md shadow-[#E83C00]/20 hover:bg-[#c93400] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={16} />
                      <div className="text-left">
                        <p className="text-xs font-black">Submit your project</p>
                        <p className="text-[10px] opacity-70">Fill in your agent details &amp; links</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="opacity-70" />
                  </button>

                  {/* Certificates (Only available if demo URL submitted) */}
                  {data.demoUrl ? (
                    <button
                      onClick={generateCertificate}
                      className="w-full flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl hover:bg-emerald-100 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Award size={16} className="text-emerald-500" />
                        <div className="text-left">
                          <p className="text-xs font-black">Download Certificate</p>
                          <p className="text-[10px] opacity-80 font-medium">Your participation certificate is ready!</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="opacity-70" />
                    </button>
                  ) : (
                    <div className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-200 text-slate-400 rounded-2xl opacity-75">
                      <div className="flex items-center gap-3">
                        <Award size={16} />
                        <div className="text-left">
                          <p className="text-xs font-black">Download Certificate</p>
                          <p className="text-[10px] font-medium">Submit your project demo to unlock</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── PLAYBOOK TAB ── */}
              {activeTab === 'playbook' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center gap-2.5">
                    <BookOpen className="text-[#E83C00]" size={16} />
                    <h2 className="text-sm font-black text-slate-900">Hackathon Schedule</h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="relative border-l-2 border-slate-100 ml-4 space-y-8 pb-4">
                      {[
                        { time: '09:00 AM', title: 'Check-in & Breakfast', icon: '☕' },
                        { time: '10:00 AM', title: 'Opening Ceremony & Rules', icon: '🎤' },
                        { time: '10:30 AM', title: 'Hacking Begins!', icon: '🚀', highlight: true },
                        { time: '01:00 PM', title: 'Lunch Break', icon: '🍱' },
                        { time: '04:00 PM', title: 'Mentor Check-ins', icon: '💡' },
                        { time: '08:00 PM', title: 'Dinner', icon: '🍕' },
                        { time: '10:00 PM', title: 'Hacking Ends / Submissions Close', icon: '🛑', highlight: true },
                        { time: '10:30 PM', title: 'Judging (Round 1)', icon: '⚖️' },
                        { time: '11:30 PM', title: 'Finals & Closing Ceremony', icon: '🏆' },
                      ].map((item, i) => (
                        <div key={i} className="relative pl-6">
                          <span className="absolute -left-3.5 top-0.5 text-lg bg-white rounded-full p-1 shadow-sm border border-slate-100">{item.icon}</span>
                          <div className="pt-1.5">
                            <span className="text-[10px] font-bold text-[#E83C00] uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-md inline-block mb-1">{item.time}</span>
                            <h3 className={`text-sm ${item.highlight ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>{item.title}</h3>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── SUBMISSION TAB ── */}
              {activeTab === 'submission' && (
                <>
                  {(data.projectTitle || data.agentName || data.demoUrl) && !isEditingSubmission ? (
                    <div className="space-y-6">
                      {/* 3D Interactive Lanyard Pass ONLY */}
                      <div className="bg-[#F4ECE1]/60 rounded-3xl border border-[#EAE4D8] p-3 sm:p-4 shadow-sm text-center relative overflow-hidden">
                        <div className="flex items-center justify-between mb-1 px-1">
                          <span className="text-[10px] sm:text-xs font-bold text-[#E83C00] uppercase tracking-widest block">OFFICIAL PARTICIPANT PASS</span>
                          <button
                            type="button"
                            onClick={() => setIsEditingSubmission(true)}
                            className="px-3.5 py-1.5 bg-white border border-[#EAE4D8] hover:border-[#E83C00] text-slate-800 text-xs font-bold rounded-xl shadow-2xs transition-all"
                          >
                            Edit Submission
                          </button>
                        </div>
                        
                        <LanyardBadge 
                          participantName={data.members[0]?.name || 'Participant'}
                          memberRole="Team Lead"
                          teamName={data.name}
                          trackName={data.track.name}
                          tableNumber={data.tableNumber}
                          agentName={data.agentName}
                          agentPhoneNumber={data.agentPhoneNumber}
                          agentNumber={data.tableNumber ? `#${data.tableNumber.replace(/[^0-9]/g, '') || '01'}` : '#01'}
                          projectTitle={data.projectTitle}
                          agentSolution={data.agentSolution}
                          techStack={data.techStack}
                          members={data.members}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5">
                          <FileText className="text-[#E83C00]" size={16} />
                          <div>
                            <h2 className="text-sm font-black text-slate-900">Project Submission</h2>
                            <p className="text-[10px] text-slate-400 mt-0.5">Fill in your project details below</p>
                          </div>
                        </div>

                        {isEditingSubmission && (
                          <button
                            type="button"
                            onClick={() => setIsEditingSubmission(false)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-all"
                          >
                            Cancel &amp; View Pass
                          </button>
                        )}
                      </div>

                      <form onSubmit={(e) => { e.preventDefault(); setShowNameConfirmModal(true); }} className="p-5 space-y-5">

                        {/* Team name (readonly) */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                          <Users size={14} className="text-slate-400 shrink-0" />
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Team Name</p>
                            <p className="text-sm font-black text-slate-800">{data.name}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Field label="Agent Name" placeholder="e.g. VoiceGenie" value={agentName} onChange={setAgentName} hint="Name of your AI agent" required />
                          <Field label="Agent Phone Number" placeholder="+1 (555) 000-0000" value={agentPhoneNumber} onChange={setAgentPhoneNumber} hint="For live demo verification" required />
                        </div>

                        <Field label="Project Title" placeholder="e.g. Real-time Voice Triage Bot" value={projectTitle} onChange={setProjectTitle} />

                        <Field label="What are you building?" placeholder="Describe what your project does in 1-2 sentences..." value={projectDescription} onChange={setProjectDescription} textarea rows={3} />
                        <Field label="Solution for your Agent" placeholder="Explain the specific problem your agent solves, and how it uses voice AI..." value={agentSolution} onChange={setAgentSolution} textarea rows={4} />

                        <Field label="Demo / Video URL" placeholder="https://youtube.com/... or Loom" value={demoUrl} onChange={setDemoUrl} type="url" />

                        <Field label="Tech Stack (comma separated)" placeholder="e.g. NestJS, React, ElevenLabs, Whisper" value={techStackText} onChange={setTechStackText} />

                        {/* Team Members Section */}
                        <div className="pt-4 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Team Members</h3>
                              <p className="text-[10px] text-slate-500 mt-0.5">Add up to 3 members</p>
                            </div>
                            {membersForm.length < 3 && (
                              <button
                                type="button"
                                onClick={() => setMembersForm([...membersForm, { name: '', email: '', linkedin: '', github: '' }])}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-all"
                              >
                                <Plus size={12} /> Add Member
                              </button>
                            )}
                          </div>

                          <div className="space-y-3">
                            {membersForm.map((member, idx) => (
                              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex gap-3 items-start relative group">
                                <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                                  <User size={14} />
                                </div>
                                <div className="flex-1 space-y-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Field label="Full Name *" placeholder="John Doe" value={member.name} onChange={(v) => {
                                      const newM = [...membersForm]; newM[idx].name = v; setMembersForm(newM);
                                    }} required />
                                    <Field label="Email Address *" type="email" placeholder="john@example.com" value={member.email} onChange={(v) => {
                                      const newM = [...membersForm]; newM[idx].email = v; setMembersForm(newM);
                                    }} required />
                                  </div>
                                </div>
                                {membersForm.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newM = [...membersForm];
                                      newM.splice(idx, 1);
                                      setMembersForm(newM);
                                    }}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={saving}
                          className="flex items-center justify-center gap-2 w-full py-3 text-xs font-black rounded-xl text-white transition-all bg-[#E83C00] hover:bg-[#c93400] disabled:opacity-50 shadow-md shadow-[#E83C00]/20"
                        >
                          <Save size={13} />
                          {saving ? 'Saving…' : 'Save Submission'}
                        </button>
                      </form>
                    </div>
                  )}
                </>
              )}

              {/* ── BONUS POINTS TAB ── */}
              {activeTab === 'bonus' && (
                <>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center gap-2.5">
                      <Star className="text-amber-500" size={16} />
                      <div>
                        <h2 className="text-sm font-black text-slate-900">Bonus Points</h2>
                        <p className="text-[10px] text-slate-400 mt-0.5">Earn up to +2 bonus points</p>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Follow <span className="font-bold text-slate-800">SnapServe.ai</span> on social media to earn bonus points that are added to your score!
                      </p>

                      {/* Instagram */}
                      <SocialCard
                        platform="Instagram"
                        handle="@snapserve_ai"
                        url="https://www.instagram.com/snapserve_ai"
                        icon={<Instagram size={20} className="text-pink-500" />}
                        color="pink"
                        followed={followedInstagram}
                        onToggle={(v) => handleBonusToggle('instagram', v)}
                        disabled={savingBonus || followedInstagram}
                        status={data?.bonusPoints && data.bonusPoints > 0 ? (followedInstagram ? 'verified' : 'none') : (followedInstagram ? 'pending' : 'none')}
                      />

                      {/* LinkedIn */}
                      <SocialCard
                        platform="LinkedIn"
                        handle="SnapServe.ai"
                        url="https://www.linkedin.com/company/snapserve-ai/"
                        icon={<Linkedin size={20} className="text-blue-600" />}
                        color="blue"
                        followed={followedLinkedin}
                        onToggle={(v) => handleBonusToggle('linkedin', v)}
                        disabled={savingBonus || followedLinkedin}
                        status={data?.bonusPoints && data.bonusPoints > 1 ? (followedLinkedin ? 'verified' : 'none') : (followedLinkedin ? 'pending' : 'none')}
                      />

                      {/* Total */}
                      <div className="mt-5 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Your Bonus Points</p>
                          <p className="text-xs text-amber-700 mt-0.5">Added to your team's total score</p>
                        </div>
                        <p className="text-4xl font-black text-amber-600">{bonusPoints}<span className="text-lg">/2</span></p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── LEADERBOARD TAB ── */}
              {activeTab === 'leaderboard' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Trophy className="text-amber-500" size={16} />
                        <h2 className="text-sm font-black text-slate-900">Live Leaderboard</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        {lastRefresh && (
                          <p className="text-[9px] text-slate-400 hidden sm:block">
                            Updated {lastRefresh.toLocaleTimeString()}
                          </p>
                        )}
                        <button
                          onClick={() => fetchLeaderboard(lbRound)}
                          disabled={lbLoading}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                        >
                          <RefreshCw size={12} className={lbLoading ? 'animate-spin' : ''} />
                        </button>
                      </div>
                    </div>

                    {/* Round tabs */}
                    <div className="flex border-b border-slate-100">
                      {[1, 2, 3].map(r => (
                        <button
                          key={r}
                          onClick={() => setLbRound(r)}
                          className={`flex-1 py-2.5 text-[11px] font-bold transition-all ${
                            lbRound === r
                              ? 'text-[#E83C00] border-b-2 border-[#E83C00]'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {r === 3 ? 'Finals' : `Round ${r}`}
                        </button>
                      ))}
                    </div>

                    {lbLoading && leaderboard.length === 0 ? (
                      <div className="py-12 flex items-center justify-center gap-2 text-slate-400">
                        <RefreshCw size={14} className="animate-spin" />
                        <span className="text-xs font-medium">Loading…</span>
                      </div>
                    ) : leaderboard.length === 0 ? (
                      <div className="py-12 text-center">
                        <Medal size={36} className="mx-auto text-slate-200 mb-2" />
                        <p className="text-xs text-slate-400 font-medium">No scores yet for this round</p>
                      </div>
                    ) : (
                      <>
                        {/* Podium top-3 */}
                        {leaderboard.slice(0, 3).length === 3 && (
                          <div className="px-5 py-5 grid grid-cols-3 gap-3 border-b border-slate-100">
                            {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, i) => {
                              const pos = i === 0 ? 2 : i === 1 ? 1 : 3
                              const heights = ['h-20', 'h-28', 'h-16']
                              const colors = ['bg-slate-100 text-slate-600', 'bg-amber-50 text-amber-600 border border-amber-200', 'bg-orange-50 text-orange-600']
                              const medals = ['🥈', '🥇', '🥉']
                              return (
                                <div key={entry.teamId} className={`flex flex-col items-center gap-1 ${i === 1 ? 'order-2' : i === 0 ? 'order-1' : 'order-3'}`}>
                                  <span className="text-lg">{medals[i]}</span>
                                  <div className={`w-full ${heights[i]} rounded-xl ${colors[i]} flex flex-col items-center justify-end pb-2`}>
                                    <p className="text-xs font-black leading-tight text-center px-1">{entry.teamName.split(' ').slice(0, 2).join(' ')}</p>
                                    <p className="text-[10px] font-bold opacity-70">{entry.overallScore.toFixed(2)}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Full table */}
                        <div className="divide-y divide-slate-50">
                          {leaderboard.map(entry => {
                            const isMyTeam = entry.teamId === data?.id
                            return (
                              <div
                                key={entry.teamId}
                                className={`flex items-center gap-3 px-5 py-3 transition-colors ${isMyTeam ? 'bg-[#E83C00]/5' : 'hover:bg-slate-50'}`}
                              >
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                                  entry.rank === 1 ? 'bg-amber-100 text-amber-700' :
                                  entry.rank === 2 ? 'bg-slate-100 text-slate-600' :
                                  entry.rank === 3 ? 'bg-orange-100 text-orange-700' :
                                  'bg-slate-50 text-slate-400'
                                }`}>
                                  {entry.rank}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-bold truncate ${isMyTeam ? 'text-[#E83C00]' : 'text-slate-800'}`}>
                                    {entry.teamName} {isMyTeam && <span className="text-[9px] opacity-60">(You)</span>}
                                  </p>
                                  <p className="text-[10px] text-slate-400 truncate">{entry.track} · {entry.judgeCount} judge{entry.judgeCount !== 1 ? 's' : ''}</p>
                                </div>
                                <p className="text-sm font-black text-slate-800 shrink-0">{entry.overallScore.toFixed(2)}</p>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/90 backdrop-blur-md border-t border-slate-200 px-2 py-2 safe-area-pb">
        <div className="flex gap-1">
          {TABS.map(tab => (
            <TabButton key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
          ))}
        </div>
      </nav>

      {/* ── Help Request Modal ── */}
      <AnimatePresence>
        {helpModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(8,13,28,0.72)', backdropFilter: 'blur(6px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-orange-100 border border-orange-200 text-orange-600">
                    <Bell size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Request Help</h3>
                    <p className="text-xs text-slate-500 mt-0.5">A mentor will come to Table {data?.tableNumber || '?'}</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Issue Type</label>
                  <select
                    value={helpIssueType}
                    onChange={(e) => setHelpIssueType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#E83C00] focus:ring-1 focus:ring-[#E83C00] transition-all appearance-none"
                  >
                    <option>Technical Issue</option>
                    <option>API / Integration</option>
                    <option>Design / UX</option>
                    <option>Presentation Prep</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Description (Optional)</label>
                  <textarea
                    value={helpDescription}
                    onChange={(e) => setHelpDescription(e.target.value)}
                    placeholder="Briefly describe what you need help with..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#E83C00] focus:ring-1 focus:ring-[#E83C00] transition-all min-h-[80px]"
                  />
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  onClick={() => setHelpModalOpen(false)}
                  disabled={submittingHelp}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestHelp}
                  disabled={submittingHelp}
                  className="px-5 py-2 bg-[#E83C00] text-white text-xs font-bold rounded-xl shadow-md shadow-[#E83C00]/20 hover:bg-[#c93400] transition-all disabled:opacity-75 flex items-center gap-2"
                >
                  {submittingHelp && <RefreshCw size={12} className="animate-spin" />}
                  Request Mentor
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Name Confirmation Modal before Form Save ── */}
      <AnimatePresence>
        {showNameConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(8,13,28,0.75)', backdropFilter: 'blur(6px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl border border-slate-100"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center font-black text-xl shrink-0">
                    <Award size={24} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Confirm Member Names</h3>
                    <p className="text-xs text-slate-500 font-medium">Verify spelling for Certificate &amp; 3D Pass</p>
                  </div>
                </div>

                <div className="bg-amber-50/90 border border-amber-200/90 p-4 rounded-2xl space-y-2 text-left">
                  <p className="text-xs text-amber-900 font-medium leading-relaxed">
                    Please double-check member names below. Your official <span className="font-bold text-amber-950">Hackathon Participation Certificates</span> and <span className="font-bold text-amber-950">3D Lanyard Pass</span> will be generated with these exact names:
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {membersForm.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-amber-200 text-slate-900 text-xs font-bold shadow-2xs">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                          {m.name || 'Unnamed Member'}
                        </span>
                        <span className="text-[10px] text-amber-700 uppercase font-black tracking-wider">
                          {idx === 0 ? 'Team Lead' : 'Team Member'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNameConfirmModal(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                  >
                    Go Back &amp; Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-3 bg-[#E83C00] hover:bg-[#c93400] text-white text-xs font-black rounded-xl transition-all shadow-md shadow-[#E83C00]/20 flex items-center justify-center gap-2"
                  >
                    {saving ? 'Saving...' : 'Confirm & Generate Pass'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Field Component ──────────────────────────────────────────────────────────

function Field({
  label, placeholder, value, onChange, textarea, rows, type, hint, required
}: {
  label: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  textarea?: boolean
  rows?: number
  type?: string
  hint?: string
  required?: boolean
}) {
  const cls = "w-full text-xs font-bold text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/80 outline-none focus:border-[#E83C00] focus:ring-2 focus:ring-[#E83C00]/15 focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-medium"
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
        {label} {required && <span className="text-red-500">*</span>}
        {hint && <span className="normal-case tracking-normal font-normal text-slate-400">· {hint}</span>}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows || 3}
          className={`${cls} resize-none`}
        />
      ) : (
        <input
          type={type || 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
          required={required}
        />
      )}
    </div>
  )
}

// ─── Social Card Component ────────────────────────────────────────────────────

function SocialCard({
  platform, handle, url, icon, color, followed, onToggle, disabled, status
}: {
  platform: string
  handle: string
  url: string
  icon: React.ReactNode
  color: 'pink' | 'blue'
  followed: boolean
  onToggle: (v: boolean) => void
  disabled?: boolean
  status?: 'none' | 'pending' | 'verified'
}) {
  const colorMap = {
    pink: {
      bg: followed ? 'bg-pink-50 border-pink-200' : 'bg-white border-slate-200',
      btn: followed ? 'bg-pink-100 text-pink-600 border-pink-200' : 'bg-white text-pink-500 border-pink-200 hover:bg-pink-50',
    },
    blue: {
      bg: followed ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200',
      btn: followed ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50',
    },
  }
  const c = colorMap[color]

  let buttonContent = <>+ I Follow</>
  if (status === 'verified') buttonContent = <><CheckCircle2 size={11} /> Verified!</>
  else if (status === 'pending') buttonContent = <><Clock size={11} /> Pending Verification</>
  else if (followed) buttonContent = <><CheckCircle2 size={11} /> Claimed</>

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${c.bg}`}>
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-slate-800">{platform}</p>
        <p className="text-[10px] text-slate-400">{handle}</p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all shrink-0"
      >
        <ExternalLink size={12} />
      </a>
      <button
        onClick={() => {
          if (!followed) {
            window.open(url, '_blank', 'noopener,noreferrer')
          }
          if (!disabled) onToggle(!followed)
        }}
        disabled={disabled || status === 'pending' || status === 'verified'}
        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${c.btn} disabled:opacity-75 disabled:cursor-not-allowed`}
      >
        {buttonContent}
      </button>
    </div>
  )
}
