import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
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
  Building,
  Briefcase,
} from 'lucide-react'
import { toast } from 'sonner'

const CLOSING_DATE = '2026-08-10T23:59:59+05:30'

const TECH_CHIPS = [
  'React', 'Next.js', 'Python', 'FastAPI', 'OpenAI', 'Sarvam', 
  'Whisper', 'ElevenLabs', 'LangGraph', 'Supabase', 'Docker', 'Vapi'
]

interface TeamMember {
  id: string
  name: string
  email: string
  phone: string
  linkedin: string
  github: string
  role?: string
}

export function ApplicationPage() {
  const [regType, setRegType] = useState<'STUDENT' | 'PROFESSIONAL' | null>(null)
  const [step, setStep] = useState(1)
  const { days, hours, minutes } = useCountdown(CLOSING_DATE)

  // Form State
  const [teamName, setTeamName] = useState('')
  const [collegeName, setCollegeName] = useState('')
  const [department, setDepartment] = useState('')
  const [yearOfStudy, setYearOfStudy] = useState('')
  
  // Professional specific fields
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')

  // Members State
  const [members, setMembers] = useState<TeamMember[]>([
    { id: '1', name: '', email: '', phone: '', linkedin: '', github: '', role: 'Team Lead' }
  ])

  // Project State
  const [projectTitle, setProjectTitle] = useState('')
  const [projectIdea, setProjectIdea] = useState('')
  const [voiceExperience, setVoiceExperience] = useState('')
  const [selectedTech, setSelectedTech] = useState<string[]>([])

  // Submission State
  const [submitting, setSubmitting] = useState(false)
  const [successAppId, setSuccessAppId] = useState('')
  const [screen, setScreen] = useState<'selection' | 'form' | 'success'>('selection')

  // Handlers
  const addMember = () => {
    if (members.length >= 4) {
      toast.error('Teams can have a maximum of 4 members.')
      return
    }
    const newMember: TeamMember = {
      id: Math.random().toString(),
      name: '',
      email: '',
      phone: '',
      linkedin: '',
      github: '',
      role: regType === 'PROFESSIONAL' ? '' : 'Member'
    }
    setMembers([...members, newMember])
  }

  const removeMember = (id: string) => {
    if (members.length <= 1) return
    setMembers(members.filter(m => m.id !== id))
  }

  const updateMember = (id: string, field: keyof TeamMember, value: string) => {
    setMembers(members.map(m => m.id === id ? { ...m, [field]: value } : m))
  }

  const toggleTech = (tech: string) => {
    if (selectedTech.includes(tech)) {
      setSelectedTech(selectedTech.filter(t => t !== tech))
    } else {
      setSelectedTech([...selectedTech, tech])
    }
  }

  const handleNext = () => {
    if (step === 1) {
      if (!teamName) {
        toast.error('Please enter a team name.')
        return
      }
      if (regType === 'STUDENT' && (!collegeName || !department || !yearOfStudy)) {
        toast.error('Please complete all college parameters.')
        return
      }
      if (regType === 'PROFESSIONAL' && (!companyName || !industry)) {
        toast.error('Please fill in your company credentials.')
        return
      }
    }
    if (step === 2) {
      const leader = members[0]
      if (!leader.name || !leader.email || !leader.phone || !leader.linkedin) {
        toast.error('Team Leader contact details are required.')
        return
      }
    }
    if (step === 3) {
      if (!projectTitle || !projectIdea || !voiceExperience) {
        toast.error('Please outline your project idea and engineering stack.')
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
    setSubmitting(true)

    const payload = {
      teamName,
      type: regType,
      college: regType === 'STUDENT' ? collegeName : undefined,
      company: regType === 'PROFESSIONAL' ? companyName : undefined,
      projectTitle,
      projectDescription: projectIdea,
      experience: voiceExperience,
      techStack: selectedTech,
      members: members.map(m => ({
        name: m.name,
        email: m.email,
        phone: m.phone || undefined,
        linkedin: m.linkedin || undefined,
        github: m.github || undefined,
        role: m.role || 'Member'
      }))
    }

    try {
      const res = await api.applications.create(payload)
      if (res.data && res.data.success) {
        setSuccessAppId(res.data.data.id || `APP-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`)
        setScreen('success')
        toast.success('Registration details submitted successfully!')
      } else {
        toast.error('Failed to submit application. Please check your inputs.')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Error occurred during submission. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectTrack = (type: 'STUDENT' | 'PROFESSIONAL') => {
    setRegType(type)
    setStep(1)
    setScreen('form')
  }

  return (
    <div className="min-h-screen bg-[#050811] text-[#F8FAFC] flex flex-col relative overflow-x-hidden">
      <Navbar />

      {/* Siri Ambient Glow effects */}
      <div className="absolute top-[-100px] left-1/4 w-[700px] h-[700px] bg-gradient-to-tr from-[#5B5CEB]/10 to-[#06B6D4]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-[#8B5CF6]/5 rounded-full blur-[120px] pointer-events-none" />

      <main className="flex-grow pt-32 pb-16 px-6 max-w-6xl mx-auto w-full relative z-10 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          
          {/* SCREEN 1: CHOOSE STUDENT OR PROFESSIONAL TRACK */}
          {screen === 'selection' && (
            <motion.div
              key="selection-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-4xl w-full space-y-12"
            >
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-1 bg-[#5B5CEB]/10 border border-[#5B5CEB]/25 px-3.5 py-1.5 rounded-full">
                  <Sparkles size={11} className="text-[#06B6D4] animate-pulse" />
                  <span className="text-[9px] text-[#5B5CEB] font-bold uppercase tracking-widest">Registration Portal</span>
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight text-white leading-none">
                  Choose Your <span className="gradient-text-primary text-shimmer">Track</span>
                </h1>
                <p className="text-sm text-[#94A3B8] max-w-lg mx-auto font-light leading-relaxed">
                  Apply for the AI Voice Agent Hackathon. Complete your registration path to receive API keys and calendar details.
                </p>
              </div>

              {/* Dual Cards */}
              <div className="grid md:grid-cols-2 gap-6 pt-4">
                
                {/* Student Card */}
                <motion.div
                  whileHover={{ y: -6, borderColor: 'rgba(91, 92, 235, 0.4)' }}
                  onClick={() => selectTrack('STUDENT')}
                  className="bg-[#0B1220]/60 backdrop-blur-xl border border-white/5 p-8 rounded-3xl cursor-pointer transition-all duration-300 relative group flex flex-col justify-between h-80 shadow-2xl"
                >
                  <div className="space-y-6">
                    <div className="w-12 h-12 rounded-2xl bg-[#5B5CEB]/10 border border-[#5B5CEB]/20 flex items-center justify-center text-[#5B5CEB] group-hover:bg-[#5B5CEB] group-hover:text-white transition-all duration-300">
                      <Building size={20} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-display font-extrabold text-lg text-white">Student track</h3>
                      <p className="text-xs text-[#94A3B8] leading-relaxed font-light">
                        For university innovators, ML student clubs, and speech researchers. Requires academic institution parameters.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#5B5CEB] font-bold group-hover:translate-x-1.5 transition-transform duration-300">
                    Enroll as Student Team <ArrowRight size={14} />
                  </div>
                </motion.div>

                {/* Professional Card */}
                <motion.div
                  whileHover={{ y: -6, borderColor: 'rgba(6, 182, 212, 0.4)' }}
                  onClick={() => selectTrack('PROFESSIONAL')}
                  className="bg-[#0B1220]/60 backdrop-blur-xl border border-white/5 p-8 rounded-3xl cursor-pointer transition-all duration-300 relative group flex flex-col justify-between h-80 shadow-2xl"
                >
                  <div className="space-y-6">
                    <div className="w-12 h-12 rounded-2xl bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center text-[#06B6D4] group-hover:bg-[#06B6D4] group-hover:text-white transition-all duration-300">
                      <Briefcase size={20} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-display font-extrabold text-lg text-white">Professional track</h3>
                      <p className="text-xs text-[#94A3B8] leading-relaxed font-light">
                        For startup builders, corporate engineers, and independent speech scientists. Requires company parameters.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#06B6D4] font-bold group-hover:translate-x-1.5 transition-transform duration-300">
                    Enroll as Professional Team <ArrowRight size={14} />
                  </div>
                </motion.div>

              </div>

              {/* Countdown Timer */}
              <div className="bg-[#0B1220]/40 border border-white/5 p-6 rounded-2xl max-w-sm mx-auto shadow-xl text-center">
                <div className="text-[9px] font-mono tracking-widest text-[#94A3B8] uppercase mb-3">Applications Closing in</div>
                <div className="flex justify-center gap-4">
                  <div className="text-center">
                    <span className="font-mono text-xl font-bold text-white block">{String(days).padStart(2, '0')}</span>
                    <span className="text-[8px] font-bold text-[#94A3B8] uppercase">Days</span>
                  </div>
                  <span className="text-[#94A3B8]/40 font-bold">:</span>
                  <div className="text-center">
                    <span className="font-mono text-xl font-bold text-white block">{String(hours).padStart(2, '0')}</span>
                    <span className="text-[8px] font-bold text-[#94A3B8] uppercase">Hours</span>
                  </div>
                  <span className="text-[#94A3B8]/40 font-bold">:</span>
                  <div className="text-center">
                    <span className="font-mono text-xl font-bold text-white block">{String(minutes).padStart(2, '0')}</span>
                    <span className="text-[8px] font-bold text-[#94A3B8] uppercase">Mins</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* SCREEN 2: REGISTRATION WIZARD */}
          {screen === 'form' && (
            <motion.div
              key="form-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-2xl bg-[#0B1220]/75 backdrop-blur-3xl border border-white/5 rounded-3xl p-8 shadow-2xl relative"
            >
              <div className="absolute top-0 inset-x-0 h-[2.5px] bg-[#5B5CEB]" />

              {/* Progress bar */}
              <div className="flex items-center gap-2 mb-8">
                {[1, 2, 3, 4].map((stepNum) => {
                  const isActive = stepNum === step
                  const isCompleted = stepNum < step
                  return (
                    <div key={stepNum} className="flex-grow flex items-center gap-1">
                      <div className="flex-grow h-[3px] bg-white/5 rounded-full relative overflow-hidden">
                        <motion.div 
                          className="absolute inset-0 bg-[#5B5CEB]"
                          initial={{ width: '0%' }}
                          animate={{ width: isActive ? '50%' : isCompleted ? '100%' : '0%' }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <span className={`text-[10px] font-mono font-bold w-4 text-center ${
                        isActive ? 'text-[#5B5CEB]' : isCompleted ? 'text-[#06B6D4]' : 'text-[#475569]'
                      }`}>
                        0{stepNum}
                      </span>
                    </div>
                  )
                })}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* STEP 1: ORGANIZATION DETAILS */}
                {step === 1 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div>
                      <h2 className="font-display font-extrabold text-xl text-white tracking-tight">Team Profile</h2>
                      <p className="text-xs text-[#94A3B8] font-light mt-0.5">Define your team structure and category details.</p>
                    </div>

                    <div className="space-y-4">
                      <Input
                        label="Team Name"
                        placeholder="e.g., AudioMind"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        required
                        className="bg-[#050811]/60 border-white/10 text-white rounded-xl placeholder:text-[#475569] text-xs"
                      />

                      {regType === 'STUDENT' ? (
                        <>
                          <Input
                            label="College / University Name"
                            placeholder="e.g., BITS Pilani"
                            value={collegeName}
                            onChange={(e) => setCollegeName(e.target.value)}
                            required
                            className="bg-[#050811]/60 border-white/10 text-white rounded-xl placeholder:text-[#475569] text-xs"
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              label="Department"
                              placeholder="e.g., Computer Science"
                              value={department}
                              onChange={(e) => setDepartment(e.target.value)}
                              required
                              className="bg-[#050811]/60 border-white/10 text-white rounded-xl placeholder:text-[#475569] text-xs"
                            />
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">Year of Study</span>
                              <select
                                value={yearOfStudy}
                                onChange={(e) => setYearOfStudy(e.target.value)}
                                required
                                className="w-full bg-[#050811]/60 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#5B5CEB]/40 transition-colors"
                              >
                                <option value="" className="bg-[#0B1220]">Select Year</option>
                                <option value="1st Year" className="bg-[#0B1220]">1st Year</option>
                                <option value="2nd Year" className="bg-[#0B1220]">2nd Year</option>
                                <option value="3rd Year" className="bg-[#0B1220]">3rd Year</option>
                                <option value="4th Year" className="bg-[#0B1220]">4th Year</option>
                                <option value="Post-Graduate" className="bg-[#0B1220]">Post-Graduate</option>
                              </select>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Company Name"
                            placeholder="e.g., SpeechFlow AI"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                            className="bg-[#050811]/60 border-white/10 text-white rounded-xl placeholder:text-[#475569] text-xs"
                          />
                          <Input
                            label="Industry / Domain"
                            placeholder="e.g., HealthTech, SaaS"
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            required
                            className="bg-[#050811]/60 border-white/10 text-white rounded-xl placeholder:text-[#475569] text-xs"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: MEMBER PROFILES */}
                {step === 2 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="font-display font-extrabold text-xl text-white tracking-tight">Team Members</h2>
                        <p className="text-xs text-[#94A3B8] font-light mt-0.5">Maximum 4 members. Designated Team Lead in Card 1.</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={addMember}
                        variant="outline"
                        className="rounded-xl border-white/10 hover:bg-white/5 text-xs text-white font-bold"
                        leftIcon={<Plus size={13} />}
                      >
                        Add Member
                      </Button>
                    </div>

                    <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                      {members.map((member, idx) => (
                        <div key={member.id} className="bg-[#050811]/50 border border-white/5 p-5 rounded-2xl relative">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-mono font-bold text-[#5B5CEB] uppercase tracking-wider">
                              {idx === 0 ? '🏆 Team Leader' : `Member 0${idx + 1}`}
                            </span>
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => removeMember(member.id)}
                                className="text-[#94A3B8] hover:text-[#EF4444] p-1 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <Input
                              placeholder="Full Name"
                              value={member.name}
                              onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                              required
                              className="bg-[#0B1220]/80 border-white/10 text-white rounded-xl placeholder:text-[#475569] text-xs"
                            />

                            <Input
                              placeholder="Email Address"
                              type="email"
                              value={member.email}
                              onChange={(e) => updateMember(member.id, 'email', e.target.value)}
                              required
                              className="bg-[#0B1220]/80 border-white/10 text-white rounded-xl placeholder:text-[#475569] text-xs"
                            />

                            <Input
                              placeholder="Phone Number"
                              value={member.phone}
                              onChange={(e) => updateMember(member.id, 'phone', e.target.value)}
                              required
                              className="bg-[#0B1220]/80 border-white/10 text-white rounded-xl placeholder:text-[#475569] text-xs"
                            />

                            {regType === 'STUDENT' ? (
                              <Input
                                placeholder="LinkedIn Profile URL"
                                value={member.linkedin}
                                onChange={(e) => updateMember(member.id, 'linkedin', e.target.value)}
                                required
                                className="bg-[#0B1220]/80 border-white/10 text-white rounded-xl placeholder:text-[#475569] text-xs"
                              />
                            ) : (
                              <Input
                                placeholder="Job Role / Title (e.g. ML Lead)"
                                value={member.role || ''}
                                onChange={(e) => updateMember(member.id, 'role', e.target.value)}
                                required
                                className="bg-[#0B1220]/80 border-white/10 text-white rounded-xl placeholder:text-[#475569] text-xs"
                              />
                            )}
                          </div>

                          {regType === 'PROFESSIONAL' && (
                            <div className="mt-4">
                              <Input
                                placeholder="LinkedIn Profile URL"
                                value={member.linkedin}
                                onChange={(e) => updateMember(member.id, 'linkedin', e.target.value)}
                                required
                                className="bg-[#0B1220]/80 border-white/10 text-white rounded-xl placeholder:text-[#475569] text-xs"
                              />
                            </div>
                          )}

                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: PROJECT details */}
                {step === 3 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div>
                      <h2 className="font-display font-extrabold text-xl text-white tracking-tight">Project Concept</h2>
                      <p className="text-xs text-[#94A3B8] font-light mt-0.5">Describe your pipeline architecture and stack.</p>
                    </div>

                    <div className="space-y-4">
                      <Input
                        label="Project Title"
                        placeholder="e.g., VoiceTriage Agent"
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        required
                        className="bg-[#050811]/60 border-white/10 text-white rounded-xl placeholder:text-[#475569] text-xs"
                      />

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">Pitch your project idea</span>
                        <textarea
                          placeholder="Describe the problem, pipeline routing and voice capabilities..."
                          value={projectIdea}
                          onChange={(e) => setProjectIdea(e.target.value)}
                          required
                          rows={3}
                          className="w-full bg-[#050811]/60 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#5B5CEB]/40 transition-colors placeholder:text-[#475569]"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">Speech / LLM Experience</span>
                        <textarea
                          placeholder="Detail experience configuring ASR, TTS models, low-latency pipelines or orchestrators..."
                          value={voiceExperience}
                          onChange={(e) => setVoiceExperience(e.target.value)}
                          required
                          rows={2}
                          className="w-full bg-[#050811]/60 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#5B5CEB]/40 transition-colors placeholder:text-[#475569]"
                        />
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">Selected Tech Stack</span>
                        <div className="flex flex-wrap gap-2">
                          {TECH_CHIPS.map(tech => {
                            const isSel = selectedTech.includes(tech)
                            return (
                              <button
                                type="button"
                                key={tech}
                                onClick={() => toggleTech(tech)}
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all duration-300 ${
                                  isSel 
                                    ? 'bg-[#5B5CEB]/20 text-[#5B5CEB] border-[#5B5CEB]/40 shadow-sm' 
                                    : 'bg-white/5 text-[#94A3B8] border-white/10 hover:border-white/20'
                                }`}
                              >
                                {tech}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: REVIEW & SUBMIT */}
                {step === 4 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div>
                      <h2 className="font-display font-extrabold text-xl text-white tracking-tight">Review Details</h2>
                      <p className="text-xs text-[#94A3B8] font-light mt-0.5">Please review your fields before locking registration.</p>
                    </div>

                    <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                      
                      {/* Organization info */}
                      <div className="bg-[#050811]/50 border border-white/5 p-5 rounded-2xl">
                        <div className="text-[9px] font-mono font-bold text-[#5B5CEB] uppercase tracking-wider mb-2">Team Info</div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-[#94A3B8] block text-[10px]">Team Name</span>
                            <span className="font-bold text-white">{teamName}</span>
                          </div>
                          <div>
                            <span className="text-[#94A3B8] block text-[10px]">Category</span>
                            <span className="font-bold text-white">{regType}</span>
                          </div>
                          {regType === 'STUDENT' ? (
                            <>
                              <div>
                                <span className="text-[#94A3B8] block text-[10px]">College</span>
                                <span className="font-bold text-white">{collegeName}</span>
                              </div>
                              <div>
                                <span className="text-[#94A3B8] block text-[10px]">Year / Dept</span>
                                <span className="font-bold text-white">{yearOfStudy} - {department}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <span className="text-[#94A3B8] block text-[10px]">Company</span>
                                <span className="font-bold text-white">{companyName}</span>
                              </div>
                              <div>
                                <span className="text-[#94A3B8] block text-[10px]">Industry</span>
                                <span className="font-bold text-white">{industry}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Member list */}
                      <div className="bg-[#050811]/50 border border-white/5 p-5 rounded-2xl">
                        <div className="text-[9px] font-mono font-bold text-[#5B5CEB] uppercase tracking-wider mb-3">Members ({members.length})</div>
                        <div className="space-y-3">
                          {members.map((member, i) => (
                            <div key={member.id} className="text-xs border-b border-white/5 last:border-0 pb-2.5 last:pb-0">
                              <span className="font-bold text-white block">{member.name || 'Unnamed'}</span>
                              <span className="text-[#94A3B8] font-light text-[11px] block">
                                {member.email} // {member.role || (i === 0 ? 'Team Lead' : 'Member')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Project info */}
                      <div className="bg-[#050811]/50 border border-white/5 p-5 rounded-2xl">
                        <div className="text-[9px] font-mono font-bold text-[#5B5CEB] uppercase tracking-wider mb-2">Project Direction</div>
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-[#94A3B8] block text-[10px]">Title</span>
                            <span className="font-bold text-white">{projectTitle}</span>
                          </div>
                          <div>
                            <span className="text-[#94A3B8] block text-[10px]">Tech Stack</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedTech.map(t => (
                                <span key={t} className="text-[9px] font-bold px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">{t}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* ONBOARDING ACTIONS */}
                <div className="flex items-center justify-between border-t border-white/5 pt-6">
                  {step > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleBack}
                      className="text-xs font-bold text-[#94A3B8] hover:text-white"
                      leftIcon={<ArrowLeft size={14} />}
                    >
                      Back
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setScreen('selection')}
                      className="text-xs font-bold text-[#EF4444] hover:text-red-400"
                    >
                      Cancel
                    </Button>
                  )}

                  {step < 4 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="rounded-xl px-6 bg-[#5B5CEB] text-white hover:bg-[#5B5CEB]/90 font-bold text-xs"
                      rightIcon={<ArrowRight size={14} />}
                    >
                      Continue
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      loading={submitting}
                      className="rounded-xl px-8 bg-[#5B5CEB] text-white hover:bg-[#5B5CEB]/90 font-bold text-xs shadow-[0_10px_20px_rgba(91,92,235,0.25)]"
                      rightIcon={<Check size={14} />}
                    >
                      Submit Application
                    </Button>
                  )}
                </div>

              </form>
            </motion.div>
          )}

          {/* SCREEN 3: SUCCESS CELEBRATION */}
          {screen === 'success' && (
            <motion.div
              key="success-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-xl bg-[#0B1220]/75 backdrop-blur-3xl border border-white/5 rounded-3xl p-8 text-center shadow-2xl relative"
            >
              <div className="w-16 h-16 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center text-[#10B981] mx-auto mb-6">
                <CheckCircle2 size={32} />
              </div>

              <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">Application Received</h2>
              <p className="text-xs text-[#94A3B8] font-light mt-1 mb-8">
                Your credentials have been securely stored in our evaluation database.
                  </p>

              <div className="bg-[#050811]/50 border border-white/5 p-6 rounded-2xl max-w-sm mx-auto mb-8 text-left space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider">Application ID</span>
                  <span className="text-xs font-mono font-bold text-[#5B5CEB]">{successAppId}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider">Status</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">PENDING REVIEW</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider">Expected Review</span>
                  <span className="text-xs font-bold text-white">24–48 Hours</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                <a 
                  href="https://discord.gg/ai-voice-agent" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#5B5CEB]/10 hover:bg-[#5B5CEB]/20 text-[#5B5CEB] px-4 py-3 rounded-xl border border-[#5B5CEB]/20 text-xs font-bold transition-all"
                >
                  <MessageSquare size={14} /> Join Discord
                </a>
                <button 
                  onClick={() => toast.success('Event added to calendar!')}
                  className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl border border-white/10 text-xs font-bold transition-all"
                >
                  <Calendar size={14} /> Add to Calendar
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  )
}
export default ApplicationPage
