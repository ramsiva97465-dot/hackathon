import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  Trophy, Users, BookOpen, FileText, Star, LogOut, Save,
  Instagram, Linkedin, CheckCircle2, Clock, RefreshCw,
  ChevronRight, ChevronDown, Home, Award, ExternalLink, Medal, Bell, Megaphone, Plus, Trash2, User, Bot, Layers, AlertCircle
} from 'lucide-react'
import { BrandLockup } from '@/components/brand/BrandLogos'
import { LanyardBadge } from '@/components/ui/LanyardBadge'
import { ParticipantPlaybook } from '@/components/participant/ParticipantPlaybook'
import { ParticipantCertificate } from '@/components/participant/ParticipantCertificate'

// ─── Types ──────────────────────────────────────────────────────────────
// ────

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
  members: { id?: string; name: string; email: string; phone?: string; role: string; linkedin?: string; github?: string }[]
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

type Tab = 'home' | 'playbook' | 'submission' | 'bonus' | 'certificate'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Home', icon: <Home size={16} /> },
  { id: 'playbook', label: 'Playbook', icon: <BookOpen size={16} /> },
  { id: 'submission', label: 'Submission', icon: <FileText size={16} /> },
  { id: 'certificate', label: 'Certificate Preview 👑', icon: <Award size={16} /> },
  { id: 'bonus', label: 'Bonus Pts', icon: <Star size={16} /> },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ROUND_LABELS: Record<number, string> = { 1: 'Round 1', 2: 'Round 2', 3: 'Finals' }
const ROUND_COLORS: Record<number, string> = {
  1: 'bg-blue-500/10 text-blue-600 border-blue-200',
  2: 'bg-orange-500/10 text-orange-600 border-orange-200',
  3: 'bg-amber-500/10 text-amber-600 border-amber-200',
}

const STT_OPTIONS = [
  'Deepgram',
  'OpenAI Whisper',
  'AssemblyAI',
  'Sarvam AI',
  'Google Cloud STT',
  'Azure Speech',
  'Gladia',
  'Custom / Other'
]

const LLM_OPTIONS = [
  'OpenAI (GPT-4o)',
  'Anthropic (Claude 3.5)',
  'Groq / Llama 3',
  'Google Gemini',
  'Mistral AI',
  'Together AI',
  'Ollama / Self-hosted',
  'Custom / Other'
]

const TTS_OPTIONS = [
  'ElevenLabs',
  'Cartesia',
  'PlayHT',
  'Murf AI',
  'Rime AI',
  'Google Cloud TTS',
  'Azure TTS',
  'OpenAI Audio',
  'Custom / Other'
]

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
      className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all flex-1 md:flex-none md:flex-row md:gap-2.5 md:px-3 md:py-2.5 md:w-full ${active
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
  const [selectedMemberIndex, setSelectedMemberIndex] = useState(0)

  // Certificate release toggle state controlled by Admin
  const [certificatesReleased, setCertificatesReleased] = useState(() => {
    return localStorage.getItem('snapserve_certificates_released') === 'true'
  })

  useEffect(() => {
    const handleCertToggle = () => {
      setCertificatesReleased(localStorage.getItem('snapserve_certificates_released') === 'true')
    }
    window.addEventListener('storage', handleCertToggle)
    window.addEventListener('certificates_toggled', handleCertToggle)
    return () => {
      window.removeEventListener('storage', handleCertToggle)
      window.removeEventListener('certificates_toggled', handleCertToggle)
    }
  }, [])

  // Form state
  const [teamName, setTeamName] = useState('')
  const [projectTitle, setProjectTitle] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [agentName, setAgentName] = useState('')
  const [agentType, setAgentType] = useState<'SINGLE_AGENT' | 'MULTI_AGENT'>('SINGLE_AGENT')
  const [squadAgents, setSquadAgents] = useState<{ name: string; role: string; phone?: string }[]>([
    { name: '', role: '', phone: '' }
  ])
  const [agentSolution, setAgentSolution] = useState('')
  const [agentPhoneNumber, setAgentPhoneNumber] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [demoUrl, setDemoUrl] = useState('')
  const [sttProvider, setSttProvider] = useState('Deepgram')
  const [llmProvider, setLlmProvider] = useState('OpenAI (GPT-4o)')
  const [ttsProvider, setTtsProvider] = useState('ElevenLabs')
  const [saving, setSaving] = useState(false)
  const [membersForm, setMembersForm] = useState<{ id?: string; name: string; email: string; phone?: string; role?: string; linkedin?: string; github?: string }[]>([])

  // Bonus state
  const [followedInstagram, setFollowedInstagram] = useState(false)
  const [followedLinkedin, setFollowedLinkedin] = useState(false)
  const [socialTasks, setSocialTasks] = useState({
    instaSnapserve: false,
    instaVobiz: false,
    linkedinVobiz: false,
    linkedinSnapserve: false,
    linkedinVoiceBuilder: false,
  })
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
          setTeamName(team.name || '')
          setProjectTitle(team.projectTitle || '')
          setProjectDescription(team.projectDescription || '')
          setAgentName(team.agentName || '')
          setAgentSolution(team.agentSolution || '')
          setAgentPhoneNumber(formatPhone(team.agentPhoneNumber))
          setGithubUrl(team.githubUrl || '')
          setDemoUrl(team.demoUrl || '')
          if (team.techStack && team.techStack.length > 0) {
            const stt = team.techStack.find(s => s.startsWith('STT: '))?.replace('STT: ', '')
            const llm = team.techStack.find(s => s.startsWith('LLM: '))?.replace('LLM: ', '')
            const tts = team.techStack.find(s => s.startsWith('TTS: '))?.replace('TTS: ', '')
            if (stt) setSttProvider(stt)
            if (llm) setLlmProvider(llm)
            if (tts) setTtsProvider(tts)
          }
          setFollowedInstagram(team.followedInstagram)
          setFollowedLinkedin(team.followedLinkedin)
          const bonusPts = team.bonusPoints || 0
          const count = Math.min(5, Math.floor(bonusPts / 2))
          setSocialTasks({
            instaSnapserve: count >= 1 || team.followedInstagram,
            instaVobiz: count >= 2,
            linkedinVobiz: count >= 3,
            linkedinSnapserve: count >= 4 || team.followedLinkedin,
            linkedinVoiceBuilder: count >= 5,
          })

          // Populate members
          if (team.members && team.members.length > 0) {
            setMembersForm(team.members.map(m => ({
              id: m.id,
              name: m.name,
              email: m.email,
              phone: formatPhone(m.phone),
              role: m.role || '',
              linkedin: m.linkedin || '',
              github: m.github || ''
            })))
          } else {
            setMembersForm([{ name: '', email: '', phone: '', linkedin: '', github: '' }])
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

  const formatPhone = (p?: string | null) => {
    if (!p) return ''
    let str = p.trim()
    if (!str) return ''

    if (/e\+/i.test(str) || /^[\d.]+[eE][+-]?\d+$/.test(str)) {
      try {
        const num = Number(str)
        if (!isNaN(num)) {
          str = BigInt(Math.round(num)).toString()
        }
      } catch {
        // fallback
      }
    }

    str = str.replace(/\.0+$/, '')
    const digits = str.replace(/\D/g, '')

    if (digits.length === 10) return `+91${digits}`
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
    return digits || str
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!data) return

    if (!agentPhoneNumber || agentPhoneNumber.trim() === '') {
      toast.error('Agent Phone Number is required for the Voice-a-thon live demo.')
      return
    }

    const agentDigits = agentPhoneNumber.replace(/\D/g, '')
    if (agentDigits.length < 10) {
      toast.error('Please enter a valid 10-digit phone number (e.g. +91 9876543210).')
      return
    }

    const cleanAgentPhone = formatPhone(agentPhoneNumber)

    try {
      setSaving(true)
      let techStack = [
        `STT: ${sttProvider}`,
        `LLM: ${llmProvider}`,
        `TTS: ${ttsProvider}`
      ]

      if (agentType === 'MULTI_AGENT' && squadAgents.length > 0) {
        const squadSummary = squadAgents
          .map(sq => `${sq.name} (${sq.role})${sq.phone ? `: ${formatPhone(sq.phone)}` : ''}`)
          .join(' | ')
        techStack.push(`Squad Hotlines: ${squadSummary}`)
      }

      // Basic validation for members
      const validMembers = membersForm.filter(m => m.name.trim() !== '' && m.email.trim() !== '')
      if (validMembers.length === 0) {
        toast.error('At least one team member is required.')
        setSaving(false)
        return
      }

      const res = await api.teams.submitProject({
        teamName, projectTitle, projectDescription, agentName, agentSolution,
        agentPhoneNumber: cleanAgentPhone,
        githubUrl, demoUrl, techStack,
        followedInstagram, followedLinkedin,
        members: validMembers.map((m, idx) => ({
          ...m,
          phone: formatPhone(m.phone),
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

  const handleSocialTaskToggle = async (key: keyof typeof socialTasks, value: boolean) => {
    if (!data?.id) return
    const updated = { ...socialTasks, [key]: value }
    setSocialTasks(updated)
    const points = Object.values(updated).filter(Boolean).length * 2

    try {
      setSavingBonus(true)
      await api.teams.updateBonus(data.id, points)
      toast.success(value ? `+2 Bonus points claimed! (Total: +${points} Pts)` : 'Bonus point updated.')
      fetchMyTeam()
    } catch (err) {
      console.error(err)
      toast.error('Failed to update bonus points.')
    } finally {
      setSavingBonus(false)
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

  const bonusPoints = Object.values(socialTasks).filter(Boolean).length * 2

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
        <aside className="hidden md:flex flex-col gap-4 w-56 shrink-0 pt-1 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Menu</p>
            {TABS.filter(t => t.id !== 'certificate' || certificatesReleased).map(tab => (
              <TabButton key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
            ))}
          </div>

          {/* Team Members Card */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-[#E83C00] uppercase tracking-wider truncate">{data.track.name}</p>
                <h3 className="text-xs font-black text-slate-900 truncate">{data.name}</h3>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[8px] font-bold text-slate-400 uppercase block">Table</span>
                <span className="text-sm font-black text-slate-800">{data.tableNumber || '—'}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Team Members ({data.members.length})</p>
                <span className="text-[8.5px] font-bold text-[#E83C00] uppercase">Click to view pass</span>
              </div>
              <div className="space-y-1.5">
                {data.members.map((m, i) => {
                  const isSelected = selectedMemberIndex === i
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedMemberIndex(i)
                      }}
                      className={`w-full flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${isSelected
                        ? 'bg-orange-50/90 border-[#E83C00] shadow-2xs ring-2 ring-[#E83C00]/20'
                        : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                        }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#E83C00] to-orange-400 flex items-center justify-center font-black text-white text-[10px] shrink-0">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[11px] font-bold truncate ${isSelected ? 'text-[#E83C00]' : 'text-slate-800'}`}>{m.name}</p>
                        <p className="text-[9px] text-slate-400 truncate">{i === 0 ? 'Team Lead' : (m.role || 'Member')}</p>
                      </div>
                      {isSelected && <CheckCircle2 size={12} className="text-[#E83C00] shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Bonus Points Chip */}
          <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50 text-center shadow-sm">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Bonus Points</p>
            <p className="text-2xl font-black text-amber-700 mt-0.5">{bonusPoints}<span className="text-xs font-bold opacity-60">/10</span></p>
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
                <div className="space-y-5">

                  {/* 1. TOP SUBMIT PROJECT BANNER */}
                  {(() => {
                    const hasSubmitted = Boolean(data?.projectTitle || data?.agentName || data?.demoUrl)
                    return (
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ${hasSubmitted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                              {hasSubmitted ? 'SUBMISSION SAVED' : 'ACTION REQUIRED'}
                            </span>
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md border border-slate-200 flex items-center gap-1">
                              <Clock size={11} className="text-slate-500" /> Deadline: 21.08.2026
                            </span>
                          </div>

                          <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                            {hasSubmitted ? 'Project Submission Received' : 'Submit Project Details & Claim Access Pass'}
                          </h2>

                          <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                            {hasSubmitted
                              ? `Submitted Project: "${data.projectTitle || 'Voice AI Agent'}". Access Pass unlocked! Click below to view or update your demo URL and presentation drive link.`
                              : 'Please submit your project title, agent name, phone number, and presentation drive URL to unlock & claim your official Access Pass.'}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            if (hasSubmitted) {
                              setIsEditingSubmission(true)
                            }
                            setActiveTab('submission')
                          }}
                          className="px-4 py-2 bg-[#E83C00] hover:bg-[#d03500] text-white font-semibold text-xs rounded-lg shadow-sm hover:shadow transition-all shrink-0 flex items-center gap-2 group"
                        >
                          <FileText size={13} className="opacity-90" />
                          <span>{hasSubmitted ? 'View / Edit Submission' : 'Submit & Claim Pass'}</span>
                          <ChevronRight size={13} className="opacity-80 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    )
                  })()}

                  {/* 2. WELCOME HERO CARD */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
                    <div className="border-b border-slate-100 pb-3 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-[#E83C00]/10 text-[#E83C00] text-[10px] font-black uppercase tracking-widest rounded-md">
                          India's Biggest Voice-a-thon — AI Voice for Tamil Nadu
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        Powered by <strong className="text-[#E83C00]">Vobiz.ai</strong> · Organized by <strong className="text-slate-800">SnapServe.ai</strong>
                      </p>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-1">
                        Welcome, Builders! 👋
                      </h1>
                    </div>

                    <div className="text-xs sm:text-sm text-slate-600 space-y-2.5 leading-relaxed font-normal">
                      <p className="font-semibold text-slate-900">Today isn't a hackathon. It's your launchpad.</p>
                      <p>You have a few hours to build a real, working AI voice agent — one that talks, listens, and solves a genuine business problem over an actual phone call. No mockups. No slides. Just your agent, live on a call, proving itself in front of judges who've built and scaled voice AI for a living.</p>
                      <p>Five teams walk out winners. Every team walks out with an agent that works.</p>
                      <p className="font-bold text-[#E83C00] pt-1">Let's build something that talks back.</p>
                    </div>
                  </div>

                  {/* 3. EVENT DAY PLAN TABLE */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Clock className="text-[#E83C00]" size={18} />
                      <h2 className="text-base font-black text-slate-900">📅 Event Day Plan</h2>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2.5 font-black w-32">Time</th>
                            <th className="px-4 py-2.5 font-black">Activity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          <tr>
                            <td className="px-4 py-3 font-bold text-[#E83C00]">9:30 AM</td>
                            <td className="px-4 py-3 font-bold text-slate-900">Registration &amp; Check-in</td>
                          </tr>
                          <tr className="bg-orange-50/60">
                            <td className="px-4 py-3 font-bold text-[#E83C00]">11:00 AM</td>
                            <td className="px-4 py-3 text-slate-800">
                              <p className="font-black text-slate-900">🔔 Round 1 Begins</p>
                              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">Teams seated at tables. Judges visit each table. Present your problem statement, demo your AI agent live via a real phone call.</p>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 font-bold text-slate-500">Lunch</td>
                            <td className="px-4 py-3 text-slate-700 font-semibold">Break &amp; Networking</td>
                          </tr>
                          <tr className="bg-amber-50/60">
                            <td className="px-4 py-3 font-bold text-[#E83C00]">Post-Lunch</td>
                            <td className="px-4 py-3 text-slate-800">
                              <p className="font-black text-slate-900">🏆 Top 20 Teams announced — advance to the Grand Finale</p>
                              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">Live problem statement revealed on stage by judges</p>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 font-bold text-slate-600">+2 Hours</td>
                            <td className="px-4 py-3 text-slate-700 font-medium">Finalists build, test, and refine their agent against the new problem</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 font-bold text-slate-900">Final Round</td>
                            <td className="px-4 py-3 font-bold text-slate-900">Top 20 present live on stage</td>
                          </tr>
                          <tr className="bg-emerald-50/60">
                            <td className="px-4 py-3 font-bold text-emerald-600">Closing</td>
                            <td className="px-4 py-3 font-black text-emerald-900">🏆 Winners announced</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 4. PRIZES SECTION */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Trophy className="text-amber-500" size={18} />
                      <h2 className="text-base font-black text-slate-900">🏆 Prizes</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 rounded-xl bg-amber-500 text-white shadow-sm space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-90">🥇 1st Place</span>
                        <p className="text-xl font-black">₹50,000 Cash</p>
                        <p className="text-[11px] opacity-95">+ Trophy + SnapServe &amp; Vobiz credits</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-700 text-white shadow-sm space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">🥈 2nd Place</span>
                        <p className="text-xl font-black">₹30,000 Cash</p>
                        <p className="text-[11px] font-medium">+ Trophy + SnapServe &amp; Vobiz credits</p>
                      </div>
                      <div className="p-4 rounded-xl bg-amber-700 text-white shadow-sm space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-90">🥉 3rd Place</span>
                        <p className="text-xl font-black">₹20,000 Cash</p>
                        <p className="text-[11px] opacity-95">+ Trophy + SnapServe &amp; Vobiz credits</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900 block">4th &amp; 5th Place</span>
                          <span className="text-slate-500 text-[11px]">Trophy + SnapServe credits</span>
                        </div>
                        <Award className="text-slate-400" size={18} />
                      </div>
                      <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-purple-950 block">⭐ Participants' Choice</span>
                          <span className="text-purple-700 text-[11px]">Voted by participants themselves</span>
                        </div>
                        <Star className="text-purple-600" size={18} />
                      </div>
                    </div>
                  </div>

                  {/* 5. JUDGING CRITERIA TABLE */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Award className="text-[#E83C00]" size={18} />
                      <h2 className="text-base font-black text-slate-900">🧑⚖️ Judging Criteria</h2>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2.5 font-black w-48 sm:w-56">Criteria</th>
                            <th className="px-4 py-2.5 font-black">What Judges Are Looking For</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          <tr>
                            <td className="px-4 py-3 font-bold text-slate-900">1. Problem Clarity &amp; Business Impact</td>
                            <td className="px-4 py-3 text-slate-600 leading-relaxed">Is the agent's role clearly defined? Does it solve a real problem or enhance an actual business use case — not a generic demo?</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 font-bold text-slate-900">2. Language Accuracy</td>
                            <td className="px-4 py-3 text-slate-600 leading-relaxed">How accurately does the agent understand and respond in the language it's built for. (Note: latency is not penalized — it's model-dependent. Language accuracy is what counts.)</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 font-bold text-slate-900">3. Call Flow Design</td>
                            <td className="px-4 py-3 text-slate-600 leading-relaxed">Is the conversation flow logical, natural, and complete? Bonus for teams using Squad Agents where the problem needs multi-agent handling.</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 font-bold text-slate-900">4. Lead Source Automation</td>
                            <td className="px-4 py-3 text-slate-600 leading-relaxed">Is the agent connected to a real lead source — e.g., website form → AI agent — showing end-to-end automation, not a manual trigger?</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 font-bold text-slate-900">5. Overall Demo &amp; Presentation</td>
                            <td className="px-4 py-3 text-slate-600 leading-relaxed">Does the live call demo actually work? Is the pitch sharp, confident, and clear on stage/table?</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-center text-xs font-bold text-[#E83C00]">
                      See you on the floor. Let's make Tamil Nadu talk. 🚀
                    </div>
                  </div>

                  {/* 6. CERTIFICATE CARD (Controlled by Admin Release Toggle) */}
                  {certificatesReleased ? (
                    <button
                      onClick={() => setActiveTab('certificate')}
                      className="w-full flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl hover:bg-emerald-100 transition-all shadow-sm cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Award size={18} className="text-emerald-600" />
                        <div className="text-left">
                          <p className="text-xs font-black">Download Official Certificate</p>
                          <p className="text-[10px] opacity-80 font-medium">Released by Admin! Your participation certificate is ready.</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="opacity-70" />
                    </button>
                  ) : (
                    <div className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-200 text-slate-400 rounded-2xl opacity-80">
                      <div className="flex items-center gap-3">
                        <Award size={18} className="text-amber-500" />
                        <div className="text-left">
                          <p className="text-xs font-black text-slate-700">Official Participation Certificates</p>
                          <p className="text-[10px] font-medium text-slate-400">Certificates will be unlocked by Admin after judging concludes 🔒</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 uppercase">LOCKED BY ADMIN</span>
                    </div>
                  )}

                </div>
              )}

              {/* ── PLAYBOOK TAB ── */}
              {activeTab === 'playbook' && (
                <ParticipantPlaybook />
              )}

              {/* ── CERTIFICATE PREVIEW TAB (FOR USER REVIEW) ── */}
              {activeTab === 'certificate' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Award className="text-amber-600" size={20} />
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider">Admin Review &amp; Approval Preview</p>
                        <p className="text-[11px] text-amber-700">Previewing official participation certificate design before enabling for participants.</p>
                      </div>
                    </div>
                  </div>

                  <ParticipantCertificate
                    participantName={data.members[selectedMemberIndex]?.name || data.members[0]?.name || 'Participant'}
                    teamName={data.name}
                    trackName={data.track.name}
                  />
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

                        {(() => {
                          const activeMember = data.members[selectedMemberIndex] || data.members[0] || { name: 'Participant', role: 'Team Member' }
                          const activeRole = selectedMemberIndex === 0 ? 'Team Lead' : (activeMember.role || 'Team Member')
                          return (
                            <LanyardBadge
                              participantName={activeMember.name}
                              memberRole={activeRole}
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
                          )
                        })()}
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

                        {/* ── AGENT ARCHITECTURE TYPE (SINGLE VS MULTI AGENT) ── */}
                        <div className="space-y-2 pb-2 border-b border-slate-100">
                          <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                            <span>Agent Architecture Type *</span>
                            <span className="text-[10px] text-[#E83C00] font-bold">Select Setup Type</span>
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setAgentType('SINGLE_AGENT')}
                              className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${agentType === 'SINGLE_AGENT'
                                ? 'bg-orange-50/80 border-[#E83C00] text-slate-900 shadow-xs ring-2 ring-[#E83C00]/20'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 mt-0.5 ${agentType === 'SINGLE_AGENT' ? 'bg-[#E83C00] text-white' : 'bg-slate-200 text-slate-600'
                                }`}>
                                <Bot size={18} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-black text-slate-900">Single Agent</h4>
                                  {agentType === 'SINGLE_AGENT' && (
                                    <span className="px-1.5 py-0.2 bg-[#E83C00] text-white text-[9px] font-bold uppercase rounded">Active</span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                                  One standalone voice agent handling the entire conversation flow.
                                </p>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setAgentType('MULTI_AGENT')}
                              className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${agentType === 'MULTI_AGENT'
                                ? 'bg-orange-50/80 border-[#E83C00] text-slate-900 shadow-xs ring-2 ring-[#E83C00]/20'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 mt-0.5 ${agentType === 'MULTI_AGENT' ? 'bg-[#E83C00] text-white' : 'bg-slate-200 text-slate-600'
                                }`}>
                                <Layers size={18} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-black text-slate-900">Multi Agent (Squad)</h4>
                                  {agentType === 'MULTI_AGENT' && (
                                    <span className="px-1.5 py-0.2 bg-[#E83C00] text-white text-[9px] font-bold uppercase rounded">Active</span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                                  Multiple specialized sub-agents working together (e.g. Triage + Booking).
                                </p>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Team Name (Editable) */}
                        <Field
                          label="Team Name *"
                          placeholder="e.g. ALPHA SQUAD"
                          value={teamName}
                          onChange={setTeamName}
                          hint="Your official registered team name (converts to UPPERCASE automatically)"
                          required
                          uppercase
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Field
                            label={agentType === 'MULTI_AGENT' ? "Router / Master Agent Name *" : "Agent Name *"}
                            placeholder={agentType === 'MULTI_AGENT' ? "e.g. Master Triage Router" : "e.g. VoiceGenie"}
                            value={agentName}
                            onChange={setAgentName}
                            hint={agentType === 'MULTI_AGENT' ? "Primary agent receiving incoming calls" : "Name of your AI agent"}
                            required
                            uppercase
                          />
                          <div className="space-y-1.5">
                            <Field
                              label={agentType === 'MULTI_AGENT' ? "Master Hotline Phone Number *" : "Agent Phone Number *"}
                              placeholder="e.g. +91 98765 43210"
                              value={agentPhoneNumber}
                              onChange={setAgentPhoneNumber}
                              hint="Enter the AI hotline number purchased on Vobiz"
                              required
                            />
                            <div className="p-2.5 bg-red-50 border border-red-200/80 rounded-xl flex items-center gap-2 text-[10.5px] font-bold text-red-600 leading-snug">
                              <AlertCircle size={14} className="shrink-0 text-red-500" />
                              <span>⚠️ <strong>Mandatory Rule:</strong> Enter the AI hotline number you <u>purchased on Vobiz</u>. If this is not a number purchased via Vobiz, your submission will be rejected!</span>
                            </div>
                          </div>
                        </div>

                        {/* ── MULTI-AGENT SQUAD BREAKDOWN ── */}
                        {agentType === 'MULTI_AGENT' && (
                          <div className="p-4 bg-orange-50/40 border border-orange-200/80 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-[#E83C00] text-white flex items-center justify-center font-bold">
                                  <Layers size={15} />
                                </div>
                                <div>
                                  <h4 className="text-xs font-black text-slate-900">Sub-Agents &amp; Hotlines Roster</h4>
                                  <p className="text-[10px] text-slate-500">Detail each sub-agent &amp; its dedicated phone number</p>
                                </div>
                              </div>

                              {squadAgents.length < 5 && (
                                <button
                                  type="button"
                                  onClick={() => setSquadAgents([...squadAgents, { name: `Sub-Agent ${squadAgents.length + 1}`, role: '', phone: '' }])}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E83C00] hover:bg-[#d03500] text-white text-[10px] font-bold rounded-lg transition-all shadow-xs cursor-pointer"
                                >
                                  <Plus size={12} /> Add Sub-Agent
                                </button>
                              )}
                            </div>

                            <div className="space-y-2.5">
                              {squadAgents.map((sq, sIdx) => (
                                <div key={sIdx} className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-2.5 relative group shadow-2xs">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field
                                      label={`Sub-Agent #${sIdx + 1} Name *`}
                                      placeholder="e.g. Booking Agent"
                                      value={sq.name}
                                      onChange={(v) => {
                                        const newS = [...squadAgents]; newS[sIdx].name = v; setSquadAgents(newS);
                                      }}
                                      required
                                      uppercase
                                    />
                                    <Field
                                      label="Sub-Agent Phone Number"
                                      placeholder="e.g. +91 98765 43210"
                                      value={sq.phone || ''}
                                      onChange={(v) => {
                                        const newS = [...squadAgents]; newS[sIdx].phone = v; setSquadAgents(newS);
                                      }}
                                      hint="Dedicated Vobiz agent hotline number"
                                    />
                                  </div>
                                  {squadAgents.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newS = [...squadAgents];
                                        newS.splice(sIdx, 1);
                                        setSquadAgents(newS);
                                      }}
                                      className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-all opacity-90 sm:opacity-0 group-hover:opacity-100 shadow-xs cursor-pointer"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <Field label="Project Title" placeholder="e.g. Real-time Voice Triage Bot" value={projectTitle} onChange={setProjectTitle} />

                        <Field label="What are you building?" placeholder="Describe what your project does in 1-2 sentences..." value={projectDescription} onChange={setProjectDescription} textarea rows={3} />
                        <Field label="What problem does your agent solving?" placeholder="Explain the specific problem your agent solves, and how it uses voice AI..." value={agentSolution} onChange={setAgentSolution} textarea rows={4} />

                        <div className="space-y-1.5">
                          <Field
                            label="Presentation Drive URL *"
                            placeholder="https://drive.google.com/file/d/... or Presentation Link"
                            value={demoUrl}
                            onChange={setDemoUrl}
                            type="url"
                            hint="Google Drive link or public presentation URL for judges review"
                          />
                          <div className="p-2 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-center gap-1.5 text-[10.5px] font-bold text-amber-800">
                            <ExternalLink size={13} className="shrink-0 text-amber-600" />
                            <span>💡 <strong>Important:</strong> Please set Google Drive link access permission to <u>Public ("Anyone with the link")</u> so judges can view your presentation slides!</span>
                          </div>
                        </div>

                        <div className="pt-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                            Provider Stack (STT, LLM, TTS)
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <SelectField
                              label="STT Provider"
                              value={sttProvider}
                              onChange={setSttProvider}
                              options={STT_OPTIONS}
                              required
                            />
                            <SelectField
                              label="LLM Provider"
                              value={llmProvider}
                              onChange={setLlmProvider}
                              options={LLM_OPTIONS}
                              required
                            />
                            <SelectField
                              label="TTS Provider"
                              value={ttsProvider}
                              onChange={setTtsProvider}
                              options={TTS_OPTIONS}
                              required
                            />
                          </div>
                        </div>

                        {/* Team Members Section */}
                        <div className="pt-4 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Team Members</h3>
                                {membersForm.length === 1 ? (
                                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-[9px] font-bold">
                                    👤 Solo Hacker
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-orange-50 text-[#E83C00] border border-orange-200 text-[9px] font-bold">
                                    👥 Team ({membersForm.length} Members)
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5">Add up to 4 members per project</p>
                            </div>
                            {membersForm.length < 4 && (
                              <button
                                type="button"
                                onClick={() => setMembersForm([...membersForm, { name: '', email: '', phone: '', linkedin: '', github: '' }])}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
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
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <Field label="Full Name *" placeholder="John Doe" value={member.name} onChange={(v) => {
                                      const newM = [...membersForm]; newM[idx].name = v; setMembersForm(newM);
                                    }} required uppercase />
                                    <Field label="Email Address *" type="email" placeholder="john@example.com" value={member.email} onChange={(v) => {
                                      const newM = [...membersForm]; newM[idx].email = v; setMembersForm(newM);
                                    }} required />
                                    <Field label="Phone Number" type="tel" placeholder="9876543210" value={member.phone || ''} onChange={(v) => {
                                      const newM = [...membersForm]; newM[idx].phone = v; setMembersForm(newM);
                                    }} />
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

                        {/* Social Media Follow Verification */}
                        <div className="pt-4 border-t border-slate-100 space-y-3">
                          <div>
                            <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                              <Instagram size={13} className="text-pink-500" /> Social Media Follow Verification
                            </h3>
                            <p className="text-[10px] text-slate-500 mt-0.5">Verify that your team members have followed SnapServe on Instagram &amp; LinkedIn</p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${followedInstagram ? 'bg-pink-50/70 border-pink-200 text-pink-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}>
                              <input
                                type="checkbox"
                                checked={followedInstagram}
                                onChange={(e) => setFollowedInstagram(e.target.checked)}
                                className="mt-0.5 w-4 h-4 text-pink-600 rounded focus:ring-pink-500 border-slate-300"
                              />
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 text-xs font-bold">
                                  <Instagram size={14} className="text-pink-600" />
                                  <span>Followed Instagram (@snapserve.ai)</span>
                                </div>
                                <a
                                  href="https://instagram.com/snapserve.ai"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-pink-700 font-semibold underline block"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Open @snapserve.ai on Instagram ↗
                                </a>
                              </div>
                            </label>

                            <label className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${followedLinkedin ? 'bg-blue-50/70 border-blue-200 text-blue-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}>
                              <input
                                type="checkbox"
                                checked={followedLinkedin}
                                onChange={(e) => setFollowedLinkedin(e.target.checked)}
                                className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                              />
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 text-xs font-bold">
                                  <Linkedin size={14} className="text-blue-600" />
                                  <span>Followed LinkedIn (SnapServe)</span>
                                </div>
                                <a
                                  href="https://linkedin.com/company/snapserve"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-blue-700 font-semibold underline block"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Open SnapServe on LinkedIn ↗
                                </a>
                              </div>
                            </label>
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
                  <div className="bg-white rounded-3xl border border-[#EAE4D8] shadow-sm overflow-hidden">
                    {/* Top Header + Live Progress Bar */}
                    <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-purple-500/10 border-b border-[#EAE4D8] space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-[#E83C00] text-white flex items-center justify-center shadow-md shrink-0">
                            <Trophy size={20} />
                          </div>
                          <div>
                            <h2 className="text-base font-black text-slate-900">Bonus Points Hub</h2>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Follow official channels to gain up to +10 Bonus Pts for your leaderboard rank!</p>
                          </div>
                        </div>
                        <div className="px-3.5 py-1.5 rounded-2xl bg-white border border-amber-300 shadow-xs font-mono font-black text-sm text-[#E83C00] shrink-0">
                          +{bonusPoints} <span className="text-xs text-slate-400 font-bold">/ 10 Pts</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px] font-bold text-slate-600">
                          <span>Completion Progress</span>
                          <span className="font-mono">{bonusPoints * 10}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-[#E83C00] rounded-full transition-all duration-500"
                            style={{ width: `${(bonusPoints / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 space-y-3.5">
                      {/* 1. Instagram SnapServe.ai */}
                      <SocialCard
                        platform="Instagram (SnapServe.ai)"
                        handle="@snapserve_ai"
                        url="https://www.instagram.com/snapserve_ai?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                        icon={<Instagram size={18} className="text-white" />}
                        color="pink"
                        followed={socialTasks.instaSnapserve}
                        onToggle={(v) => handleSocialTaskToggle('instaSnapserve', v)}
                        disabled={savingBonus}
                        pts={2}
                      />

                      {/* 2. Instagram Vobiz.ai */}
                      <SocialCard
                        platform="Instagram (Vobiz.ai)"
                        handle="@vobiz_ai"
                        url="https://www.instagram.com/vobiz.ai?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                        icon={<Instagram size={18} className="text-white" />}
                        color="pink"
                        followed={socialTasks.instaVobiz}
                        onToggle={(v) => handleSocialTaskToggle('instaVobiz', v)}
                        disabled={savingBonus}
                        pts={2}
                      />

                      {/* 3. LinkedIn Vobiz */}
                      <SocialCard
                        platform="LinkedIn (Vobiz)"
                        handle="Vobiz AI"
                        url="https://www.linkedin.com/company/vobizai/"
                        icon={<Linkedin size={18} className="text-white" />}
                        color="blue"
                        followed={socialTasks.linkedinVobiz}
                        onToggle={(v) => handleSocialTaskToggle('linkedinVobiz', v)}
                        disabled={savingBonus}
                        pts={2}
                      />

                      {/* 4. LinkedIn SnapServe */}
                      <SocialCard
                        platform="LinkedIn (SnapServe)"
                        handle="SnapServe.ai"
                        url="https://www.linkedin.com/company/snapserve-ai/"
                        icon={<Linkedin size={18} className="text-white" />}
                        color="blue"
                        followed={socialTasks.linkedinSnapserve}
                        onToggle={(v) => handleSocialTaskToggle('linkedinSnapserve', v)}
                        disabled={savingBonus}
                        pts={2}
                      />

                      {/* 5. LinkedIn Voice Builder Community */}
                      <SocialCard
                        platform="LinkedIn (Voice Builder Community)"
                        handle="Voice Builder Community Group"
                        url="https://www.linkedin.com/groups/36920147/"
                        icon={<Linkedin size={18} className="text-white" />}
                        color="purple"
                        followed={socialTasks.linkedinVoiceBuilder}
                        onToggle={(v) => handleSocialTaskToggle('linkedinVoiceBuilder', v)}
                        disabled={savingBonus}
                        pts={2}
                      />

                      {/* Total Banner */}
                      <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-400/40 flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold text-lg shrink-0">
                            ⭐
                          </div>
                          <div>
                            <p className="text-xs font-black text-amber-950 uppercase tracking-wider">Total Bonus Earned</p>
                            <p className="text-[11px] text-amber-900/80 font-medium">Added live to your team leaderboard rank</p>
                          </div>
                        </div>
                        <p className="text-3xl font-black text-[#E83C00] font-mono">+{bonusPoints}<span className="text-xs font-bold text-amber-600">/10 Pts</span></p>
                      </div>
                    </div>
                  </div>
                </>
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/90 backdrop-blur-md border-t border-slate-200 px-2 py-2 safe-area-pb">
        <div className="flex gap-1">
          {TABS.filter(t => t.id !== 'certificate' || certificatesReleased).map(tab => (
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
  label, placeholder, value, onChange, textarea, rows, type, hint, required, uppercase
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
  uppercase?: boolean
}) {
  const cls = `w-full text-xs font-bold text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/80 outline-none focus:border-[#E83C00] focus:ring-2 focus:ring-[#E83C00]/15 focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-medium ${uppercase ? 'uppercase' : ''}`
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
        {label} {required && <span className="text-red-500">*</span>}
        {hint && <span className="normal-case tracking-normal font-normal text-slate-400">· {hint}</span>}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={e => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
          placeholder={placeholder}
          rows={rows || 3}
          className={`${cls} resize-none`}
        />
      ) : (
        <input
          type={type || 'text'}
          value={value}
          onChange={e => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
          placeholder={placeholder}
          className={cls}
          required={required}
        />
      )}
    </div>
  )
}

function SelectField({
  label, value, onChange, options, hint, required
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  hint?: string
  required?: boolean
}) {
  const cls = "w-full text-xs font-bold text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/80 outline-none focus:border-[#E83C00] focus:ring-2 focus:ring-[#E83C00]/15 focus:bg-white transition-all cursor-pointer"
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
        {label} {required && <span className="text-red-500">*</span>}
        {hint && <span className="normal-case tracking-normal font-normal text-slate-400">· {hint}</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cls}
        required={required}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

// ─── Social Card Component ────────────────────────────────────────────────────

function SocialCard({
  platform,
  handle,
  url,
  icon,
  color,
  followed,
  onToggle,
  disabled,
  pts = 2,
}: {
  platform: string
  handle: string
  url: string
  icon: React.ReactNode
  color: 'pink' | 'blue' | 'purple'
  followed: boolean
  onToggle: (val: boolean) => void
  disabled?: boolean
  pts?: number
}) {
  const brandIconBg = {
    pink: 'bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 text-white shadow-xs',
    blue: 'bg-[#0A66C2] text-white shadow-xs',
    purple: 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xs',
  }

  return (
    <div className={`p-4 sm:p-4.5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 ${followed
      ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
      : 'bg-white border-[#EAE4D8] hover:border-orange-300 hover:shadow-sm'
      }`}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Brand Icon Box */}
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${brandIconBg[color]}`}>
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">{platform}</h4>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border font-mono ${followed
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-orange-50 text-[#E83C00] border-orange-200'
              }`}>
              +{pts} Pts
            </span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-500 font-medium hover:text-[#E83C00] transition-colors inline-flex items-center gap-1 mt-0.5 group"
          >
            <span>{handle}</span>
            <ExternalLink size={10} className="opacity-60 group-hover:opacity-100 shrink-0" />
          </a>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
        <button
          type="button"
          onClick={() => {
            if (!followed) {
              window.open(url, '_blank', 'noopener,noreferrer')
            }
            if (!disabled) onToggle(!followed)
          }}
          disabled={disabled}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${followed
            ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
            : 'bg-[#E83C00] text-white shadow-xs hover:bg-[#FF4500]'
            }`}
        >
          {followed ? (
            <><CheckCircle2 size={14} /> Completed (+{pts} Pts)</>
          ) : (
            <><ExternalLink size={13} /> Follow &amp; Claim (+{pts} Pts)</>
          )}
        </button>
      </div>
    </div>
  )
}
