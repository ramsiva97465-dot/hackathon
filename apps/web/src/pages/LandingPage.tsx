import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCountdown } from '@/hooks/useCountdown'
import { api } from '@/lib/api'
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  Calendar, 
  MessageSquare, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  Clock,
  User,
  Users,
  Trophy,
  Award,
  ChevronRight,
  Globe,
  MapPin,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'

const CLOSING_DATE = '2026-08-10T23:59:59+05:30'

interface TeamMember {
  id: string
  name: string
  email: string
  phone: string
  linkedin: string
  github: string
}

export function LandingPage() {
  const [regType, setRegType] = useState<'INDIVIDUAL' | 'TEAM' | null>(null)
  const [step, setStep] = useState(1)
  const { days, hours, minutes } = useCountdown(CLOSING_DATE)

  // Form State
  const [teamName, setTeamName] = useState('')
  
  // Members State
  const [members, setMembers] = useState<TeamMember[]>([
    { id: '1', name: '', email: '', phone: '', linkedin: '', github: '' }
  ])

  // Project State
  const [projectTitle, setProjectTitle] = useState('')
  const [projectIdea, setProjectIdea] = useState('')

  // Submission State
  const [submitting, setSubmitting] = useState(false)
  const [successAppId, setSuccessAppId] = useState('')
  const [screen, setScreen] = useState<'selection' | 'form' | 'success'>('selection')
  const [showForm, setShowForm] = useState(false)

  // Validation helpers
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isValidLinkedIn = (url: string) => /^https?:\/\/(www\.)?linkedin\.com\/(in|pub|profile)\/[\w-]+\/?$/i.test(url) || /linkedin\.com\/in\//i.test(url)

  // Handlers
  const addMember = () => {
    if (members.length >= 3) {
      toast.error('Teams can have a maximum of 3 members.')
      return
    }
    const newMember: TeamMember = {
      id: Math.random().toString(),
      name: '',
      email: '',
      phone: '',
      linkedin: '',
      github: ''
    }
    setMembers([...members, newMember])
  }

  const removeMember = (id: string) => {
    if (members.length <= 2) {
      toast.error('A team must have at least 2 members.')
      return
    }
    setMembers(members.filter(m => m.id !== id))
  }

  const updateMember = (id: string, field: keyof TeamMember, value: string) => {
    setMembers(members.map(m => m.id === id ? { ...m, [field]: value } : m))
  }

  const handleNext = () => {
    if (regType === 'TEAM' && step === 1) {
      if (!teamName) {
        toast.error('Please enter a team name.')
        return
      }
    }
    if ((regType === 'TEAM' && step === 2) || (regType === 'INDIVIDUAL' && step === 1)) {
      for (let i = 0; i < members.length; i++) {
        const m = members[i]
        const label = i === 0 ? (regType === 'INDIVIDUAL' ? 'Your' : 'Leader') : `Member ${i + 1}`
        if (!m.name) {
          toast.error(`${label} name is required.`)
          return
        }
        if (!m.email) {
          toast.error(`${label} email is required.`)
          return
        }
        if (!isValidEmail(m.email)) {
          toast.error(`${label} email is not a valid format. e.g. name@example.com`)
          return
        }
        if (!m.linkedin) {
          toast.error(`${label} LinkedIn URL is required.`)
          return
        }
        if (!isValidLinkedIn(m.linkedin)) {
          toast.error(`${label} LinkedIn URL is not valid. e.g. https://linkedin.com/in/yourname`)
          return
        }
      }

      if (regType === 'TEAM' && members.length < 2) {
        toast.error('A team must have at least 2 members.')
        return
      }
    }
    setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent premature submissions from Enter key presses on inputs
    if (step < totalSteps) {
      handleNext()
      return
    }

    setSubmitting(true)

    const payload = {
      teamName: regType === 'INDIVIDUAL' ? members[0].name : teamName,
      type: regType,
      projectTitle: projectTitle || 'AI Voice Project',
      projectDescription: projectIdea || 'No description provided',
      techStack: [],
      members: members.map((m, idx) => ({
        name: m.name,
        email: m.email,
        phone: m.phone || undefined,
        linkedin: m.linkedin || undefined,
        github: m.github || undefined,
        role: idx === 0 ? 'Team Lead' : 'Member'
      }))
    }

    try {
      const res = await api.applications.create(payload)
      if (res.data && res.data.success) {
        setSuccessAppId(res.data.data.id || `APP-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`)
        setScreen('success')
        toast.success('Registration submitted successfully!')
      } else {
        toast.error('Failed to submit application.')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectTrack = (type: 'INDIVIDUAL' | 'TEAM') => {
    setRegType(type)
    setStep(1)
    if (type === 'TEAM') {
      setMembers([
        { id: '1', name: '', email: '', phone: '', linkedin: '', github: '' },
        { id: '2', name: '', email: '', phone: '', linkedin: '', github: '' }
      ])
    } else {
      setMembers([{ id: '1', name: '', email: '', phone: '', linkedin: '', github: '' }])
    }
    setScreen('form')
  }

  // Get total steps
  const totalSteps = regType === 'INDIVIDUAL' ? 2 : 3

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#0F172A] flex flex-col items-center py-12 px-4 md:px-6 relative overflow-x-hidden chakra-petch-all">
      <style>{`
        .chakra-petch-all, .chakra-petch-all * {
          font-family: 'Chakra Petch', sans-serif !important;
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.15); }
        }
        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 4s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* Main Luma Event Card */}
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col">
        
        {/* Cover Banner Image with Brand & Sponsor Logos */}
        <div className="w-full h-[400px] md:h-[450px] bg-[#090D16] relative flex items-end p-6 overflow-hidden" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 0)', backgroundSize: '16px 16px' }}>
          
          {/* Subtle logo backing glowing layers */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-[#06B6D4]/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 bg-[#E83C00]/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
          
          {/* Collaborative Logos Centered */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-10 px-4">
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 w-full max-w-2xl">
              
              {/* snapserve.AI Logo Card */}
              <div className="flex flex-col items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-3xl transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-105 shadow-[0_20px_40px_rgba(0,0,0,0.3)] animate-float-slow shrink-0 w-44 md:w-56">
                <svg className="w-20 h-20 md:w-24 md:h-24 shrink-0 drop-shadow-[0_8px_20px_rgba(255,255,255,0.2)]" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="32" height="32" rx="7" fill="#0A0A0C" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
                  <rect x="3" y="5.5" width="17" height="4.5" rx="2.25" fill="#52525B"/>
                  <rect x="7" y="12.5" width="17" height="4.5" rx="2.25" fill="#A1A1AA"/>
                  <rect x="11" y="19.5" width="17" height="4.5" rx="2.25" fill="#E4E4E7"/>
                </svg>
                <span className="font-black text-2xl md:text-3xl text-white tracking-tight text-center">SnapServe</span>
              </div>

              {/* Collaboration Connector */}
              <span className="text-white/20 font-light text-4xl animate-pulse hidden md:inline">✕</span>

              {/* Vobiz Logo Card */}
              <div className="flex flex-col items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-3xl transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-105 shadow-[0_20px_40px_rgba(0,0,0,0.3)] animate-float-delayed shrink-0 w-44 md:w-56">
                <svg className="w-20 h-20 md:w-24 md:h-24 shrink-0 drop-shadow-[0_8px_20px_rgba(232,60,0,0.25)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Left orange quadrant */}
                  <path d="M 25 40 A 30 30 0 0 1 55 70 L 25 70 Z" fill="#EF6A00" />
                  {/* Right sweeping arch */}
                  <path d="M 45 90 C 45 60, 60 40, 95 40 L 95 62 C 75 62, 65 72, 65 90 Z" fill="#E83C00" />
                </svg>
                <span className="font-black text-2xl md:text-3xl text-white tracking-tight text-center" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>Vobiz</span>
              </div>

            </div>

            {/* Tagline "India's Biggest AI Voiceathon" */}
            <div className="mt-2 relative flex flex-col items-center gap-2">
              <span className="text-xs md:text-sm font-black tracking-[0.3em] text-white/90 bg-white/5 backdrop-blur-md border border-white/10 px-6 py-2.5 rounded-full uppercase shadow-md transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:border-white/20">
                India's Biggest AI Voiceathon
              </span>
              <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-[#E83C00] bg-[#E83C00]/10 border border-[#E83C00]/25 px-5 py-1.5 rounded-full uppercase">
                Winning Pool: ₹50K
              </span>
            </div>
          </div>

          {/* Date Badge Bottom-Left */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-white/90 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full uppercase tracking-wider">
                Sep 05, 2026
              </span>
            </div>
          </div>
        </div>

        {/* Header Title Block */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              AI Voice Voiceathon 2026
            </h1>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Hosted by snapserve.AI</span>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Sponsored by</span>
                <span className="font-bold" style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: '#E83C00' }}>
                  Vobiz
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#E83C00] animate-pulse" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setShowForm(true)
                setScreen('selection')
                setTimeout(() => {
                  document.getElementById('registration-container')?.scrollIntoView({ behavior: 'smooth' })
                }, 50)
              }}
              className="bg-[#E83C00] hover:bg-[#E83C00]/90 text-white font-bold text-xs rounded-xl shadow-sm border border-transparent"
            >
              Register
            </Button>
          </div>
        </div>

        {/* Content Two-Column Grid */}
        <div className="grid md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-100 bg-white">
          
          {/* Left Column: Event details (3/5 width) */}
          <div className="p-6 md:p-8 md:col-span-3 space-y-8">
            
            {/* About */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">About the Voiceathon</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-light">
                  Welcome to the AI Voice Voiceathon 2026. A 24-hour sprint to build low-latency, conversational voice agents, custom pipelines, and telephony integrations. Complete the registration form to lock in your developer keys and participate.
                </p>
              </div>
              <div className="pt-1">
                <a 
                  href="/rules.pdf" 
                  download="AI_Voice_Voiceathon_Rules.pdf"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#E83C00] hover:text-[#E83C00]/80 transition-colors bg-[#E83C00]/5 hover:bg-[#E83C00]/10 border border-[#E83C00]/10 px-4 py-2.5 rounded-xl"
                >
                  <FileText size={13} />
                  Download Rules & Guidelines (PDF)
                </a>
              </div>
            </div>

            {/* Event Meta Row */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/50 flex items-center justify-center text-slate-600 shrink-0">
                  <Calendar size={15} />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-slate-800">Date & Time</h4>
                  <p className="text-xs text-slate-500 font-light mt-0.5">Sep 05, 2026</p>
                  <p className="text-[10px] text-slate-400 font-light mt-0.5">9:00 AM IST onwards</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/50 flex items-center justify-center text-slate-600 shrink-0">
                  <MapPin size={15} />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-slate-800">Location</h4>
                  <p className="text-xs text-slate-500 font-light mt-0.5">Chitlapakkam, Chennai</p>
                  <p className="text-[10px] text-slate-400 font-light mt-0.5 leading-snug">1, II Main Rd, Sarvamangala Nagar</p>
                  <a 
                    href="https://www.google.com/maps/search/?api=1&query=1,+IInd+Main+Road,+Sarvamangala+Nagar,+Chitlapakkam,+Chennai,+Tamil+Nadu+600064"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-[#E83C00] hover:underline block mt-0.5 font-bold"
                  >
                    View Map
                  </a>
                </div>
              </div>
            </div>

            {/* Prizes List */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">🏆 Winning Prizes</h3>
              
              <div className="space-y-3">
                {/* Prize 1 */}
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] shrink-0">
                    <Trophy size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">1st Place (Winner)</h4>
                    <p className="text-base font-black text-slate-950 mt-0.5">INR 50,000</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-light">Cash Award + Vapi Incubation Pitch + $2,000 API Credits</p>
                  </div>
                </div>

                {/* Prize 2 */}
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#5B5CEB]/10 border border-[#5B5CEB]/20 flex items-center justify-center text-[#5B5CEB] shrink-0">
                    <Award size={18} className="text-[#5B5CEB]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">2nd Place</h4>
                    <p className="text-base font-black text-slate-950 mt-0.5">INR 30,000</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-light">Cash Award + Sarvam GPU Cloud Credits + Mentorship Keys</p>
                  </div>
                </div>

                {/* Prize 3 */}
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center text-[#06B6D4] shrink-0">
                    <Award size={18} className="text-[#06B6D4]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">3rd Place</h4>
                    <p className="text-base font-black text-slate-950 mt-0.5">INR 20,000</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-light">Cash Award + Developer Swag Bag Kits & SnapServe API beta keys</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Registration Form wizard (2/5 width) */}
          <div id="registration-container" className="p-6 md:p-8 md:col-span-2 bg-[#F8FAFC] flex flex-col justify-center min-h-[400px]">
            
            <AnimatePresence mode="wait">
              {!showForm ? (
                <motion.div
                  key="cta"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center space-y-6 py-8"
                >
                  <div className="space-y-2">
                    <h3 className="text-lg font-extrabold text-slate-900">Registration is Open</h3>
                    <p className="text-xs text-slate-500 font-light leading-relaxed max-w-xs mx-auto">
                      Secure your place in the AI Voice Voiceathon. Build, collaborate, and compete for a ₹50K cash prize pool.
                    </p>
                  </div>

                  <Button 
                    fullWidth
                    onClick={() => {
                      setShowForm(true)
                      setScreen('selection')
                    }}
                    className="bg-[#E83C00] hover:bg-[#E83C00]/95 text-white font-black text-sm py-3.5 rounded-2xl shadow-md border border-transparent"
                    rightIcon={<ArrowRight size={14} />}
                  >
                    Register
                  </Button>

                  <div className="text-[10px] text-slate-400 font-light flex items-center justify-center gap-1">
                    <Clock size={10} />
                    <span>Closes on August 10, 2026</span>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* Form step 1: Category selection */}
                  {screen === 'selection' && (
                <motion.div
                  key="sel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Registration</h3>
                    <p className="text-xs text-slate-500 font-light">Select your participation category to begin.</p>
                  </div>

                  <div className="space-y-3">
                    {/* Individual */}
                    <button
                      type="button"
                      onClick={() => selectTrack('INDIVIDUAL')}
                      className="w-full text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#E83C00] hover:shadow-sm transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#E83C00]/10 flex items-center justify-center text-[#E83C00] group-hover:bg-[#E83C00] group-hover:text-white transition-colors duration-300">
                          <User size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">Single Person Participate</h4>
                          <p className="text-[10px] text-slate-400 font-light mt-0.5">Register as an individual builder</p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-[#E83C00] transition-colors" />
                    </button>

                    {/* Team */}
                    <button
                      type="button"
                      onClick={() => selectTrack('TEAM')}
                      className="w-full text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#E83C00] hover:shadow-sm transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#E83C00]/10 flex items-center justify-center text-[#E83C00] group-hover:bg-[#E83C00] group-hover:text-white transition-colors duration-300">
                          <Users size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">Team Participate</h4>
                          <p className="text-[10px] text-slate-400 font-light mt-0.5">Register a crew of 2–3 members</p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-[#E83C00] transition-colors" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Form step 2: The Wizard steps */}
              {screen === 'form' && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Step 0{step} of 0{totalSteps}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-light mt-0.5">
                        {regType === 'INDIVIDUAL' ? 'Solo Builder Path' : 'Team Crew Path'}
                      </p>
                      {regType === 'TEAM' && step > 1 && teamName && (
                        <p className="text-xs font-bold text-[#E83C00] mt-2.5 uppercase tracking-wider">
                          Team: {teamName}
                        </p>
                      )}
                    </div>
                    <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#E83C00] transition-all duration-300"
                        style={{ width: `${(step / totalSteps) * 100}%` }}
                      />
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* TEAM: Team Name */}
                    {regType === 'TEAM' && step === 1 && (
                      <div className="space-y-3">
                        <Input
                          label="Team Name"
                          placeholder="e.g., AudioMind"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          required
                          className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl text-xs focus:border-[#E83C00]/40"
                        />
                      </div>
                    )}

                    {/* CONTACT INFO */}
                    {((regType === 'INDIVIDUAL' && step === 1) || (regType === 'TEAM' && step === 2)) && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Members Details</span>
                          {regType === 'TEAM' && members.length < 3 && (
                            <button
                              type="button"
                              onClick={addMember}
                              className="text-[10px] font-bold text-[#E83C00] hover:underline flex items-center gap-1"
                            >
                              <Plus size={11} /> Add Member
                            </button>
                          )}
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                          {members.map((member, idx) => (
                            <div key={member.id} className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 relative">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-bold text-[#E83C00] uppercase tracking-wider">
                                  {regType === 'INDIVIDUAL' ? 'Solo Member' : idx === 0 ? '🏆 Leader' : `Member 0${idx + 1}`}
                                </span>
                                {regType === 'TEAM' && idx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => removeMember(member.id)}
                                    className="text-slate-400 hover:text-[#EF4444] transition-colors"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>

                              <div className="space-y-2">
                                <input
                                  placeholder="Full Name *"
                                  value={member.name}
                                  onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                                  required
                                  className="w-full bg-slate-50/50 border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-900 focus:outline-none focus:border-[#E83C00]/40"
                                />
                                <div>
                                  <input
                                    placeholder="Email Address *"
                                    type="email"
                                    value={member.email}
                                    onChange={(e) => updateMember(member.id, 'email', e.target.value)}
                                    required
                                    className={`w-full bg-slate-50/50 border text-xs px-3 py-2 rounded-lg text-slate-900 focus:outline-none focus:border-[#E83C00]/40 ${member.email && !isValidEmail(member.email) ? 'border-red-400' : 'border-slate-200'}`}
                                  />
                                  {member.email && !isValidEmail(member.email) && (
                                    <p className="text-[9px] text-red-500 mt-0.5 font-medium">Please enter a valid email address</p>
                                  )}
                                </div>
                                <input
                                  placeholder="Phone Number"
                                  value={member.phone}
                                  onChange={(e) => updateMember(member.id, 'phone', e.target.value)}
                                  className="w-full bg-slate-50/50 border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-900 focus:outline-none focus:border-[#E83C00]/40"
                                />
                                <div>
                                  <input
                                    placeholder="LinkedIn Profile URL *"
                                    value={member.linkedin}
                                    onChange={(e) => updateMember(member.id, 'linkedin', e.target.value)}
                                    required
                                    className={`w-full bg-slate-50/50 border text-xs px-3 py-2 rounded-lg text-slate-900 focus:outline-none focus:border-[#E83C00]/40 ${member.linkedin && !isValidLinkedIn(member.linkedin) ? 'border-red-400' : 'border-slate-200'}`}
                                  />
                                  {member.linkedin && !isValidLinkedIn(member.linkedin) && (
                                    <p className="text-[9px] text-red-500 mt-0.5 font-medium">Please enter a valid LinkedIn URL (e.g. https://linkedin.com/in/yourname)</p>
                                  )}
                                </div>
                                <input
                                  placeholder="GitHub Profile URL (optional)"
                                  value={member.github}
                                  onChange={(e) => updateMember(member.id, 'github', e.target.value)}
                                  className="w-full bg-slate-50/50 border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-900 focus:outline-none focus:border-[#E83C00]/40"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* REVIEW DETAILS */}
                    {((regType === 'INDIVIDUAL' && step === 2) || (regType === 'TEAM' && step === 3)) && (
                      <div className="space-y-3 text-xs max-h-[300px] overflow-y-auto pr-1">
                        
                        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Category</span>
                          <p className="font-bold text-slate-900">{regType === 'TEAM' ? `Team: ${teamName}` : 'Individual Participation'}</p>
                        </div>

                        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Members ({members.length})</span>
                          <div className="space-y-2">
                            {members.map((m) => (
                              <div key={m.id} className="border-b border-slate-100 last:border-0 pb-1.5 last:pb-0">
                                <span className="font-bold text-slate-900 block">{m.name || 'Unnamed'}</span>
                                <span className="text-[10px] text-slate-500 font-light block">{m.email}{m.phone ? ` // ${m.phone}` : ''}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      {step > 1 ? (
                        <button
                          type="button"
                          onClick={handleBack}
                          className="text-xs font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1"
                        >
                          <ArrowLeft size={13} /> Back
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setShowForm(false)
                            setScreen('selection')
                          }}
                          className="text-xs font-bold text-slate-400 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                      )}

                      {step < totalSteps ? (
                        <Button
                          type="button"
                          onClick={handleNext}
                          className="rounded-xl px-5 bg-[#E83C00] hover:bg-[#E83C00]/95 text-white font-bold text-xs"
                          rightIcon={<ArrowRight size={13} />}
                        >
                          Continue
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          loading={submitting}
                          className="rounded-xl px-6 bg-[#E83C00] hover:bg-[#E83C00]/95 text-white font-bold text-xs shadow-md"
                          rightIcon={<Check size={13} />}
                        >
                          Submit
                        </Button>
                      )}
                    </div>

                  </form>
                </motion.div>
              )}

              {/* Form step 3: Success card */}
              {screen === 'success' && (
                <motion.div
                  key="suc"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mx-auto">
                    <CheckCircle2 size={24} />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900">Application Received</h3>
                    <p className="text-xs text-slate-500 font-light">Your details have been successfully saved to our database.</p>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 rounded-xl text-left space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">ID</span>
                      <span className="font-mono font-bold text-slate-900">{successAppId}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Status</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-50 border border-amber-100 text-amber-600">PENDING REVIEW</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <a
                      href="https://discord.gg/ai-voice"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-[#E83C00]/10 hover:bg-[#E83C00]/20 text-[#E83C00] px-4 py-2.5 rounded-xl border border-[#E83C00]/20 text-xs font-bold transition-all"
                    >
                      <MessageSquare size={13} /> Join Discord Channel
                    </a>
                  </div>
                 </motion.div>
               )}
                </>
              )}

             </AnimatePresence>
          </div>

        </div>

      </div>
    </div>
  )
}
export default LandingPage
