import { useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { containerVariants, itemVariants } from '@/lib/motion'
import { SCORING_RUBRIC } from '@hackathon/shared'
import { ArrowLeft, Send, Info, Linkedin, Github, ExternalLink, Lock } from 'lucide-react'

type ScoreCriteriaKey = 'innovation' | 'technicalQuality' | 'aiUsage' | 'businessValue' | 'presentation' | 'bonus'

const CRITERIA_KEYS: ScoreCriteriaKey[] = ['innovation', 'technicalQuality', 'aiUsage', 'businessValue', 'presentation', 'bonus']

const mockTeam = {
  id: '3',
  teamName: 'NovaTalk',
  college: 'NIT Trichy',
  track: 'MULTIMODAL_AI',
  projectTitle: 'Multimodal AI Teaching Assistant',
  projectDescription: 'An AI tutor that combines voice, vision, and text to provide personalized 1:1 tutoring experiences. The system uses GPT-4V for image understanding, ElevenLabs for voice synthesis, and Vapi for real-time conversation management.',
  demoUrl: 'https://demo.ntt.edu',
  githubUrl: 'https://github.com/ntt/novatalk',
  presentationUrl: 'https://slides.novatalk.ai',
  members: [
    { name: 'Kiran Bose', role: 'Team Lead', linkedin: '#', github: '#' },
    { name: 'Meera Shah', role: 'UI/UX', portfolio: '#' },
    { name: 'Dev Raj', role: 'Full Stack', github: '#' },
    { name: 'Aisha Khan', role: 'ML', linkedin: '#' },
  ],
}

interface ScoreSliderProps {
  label: string
  max: number
  description: string
  value: number
  onChange: (v: number) => void
}

function ScoreSlider({ label, max, description, value, onChange }: ScoreSliderProps) {
  const pct = (value / max) * 100

  return (
    <div className="space-y-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-[#0F172A]">{label}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{description}</p>
        </div>
        <div className="shrink-0 text-right">
          <span className="font-display text-xl font-bold text-[#5B5CEB]">
            {value}
          </span>
          <span className="text-[10px] text-slate-400">/{max}</span>
        </div>
      </div>
      <div className="space-y-2">
        <input
          type="range"
          min={0}
          max={max}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-1 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[#5B5CEB]"
          style={{
            background: `linear-gradient(to right, #5B5CEB ${pct}%, #E2E8F0 ${pct}%)`,
          }}
        />
        <div className="flex justify-between text-[8px] font-bold text-slate-400">
          <span>0</span>
          <span>{Math.round(max / 2)}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  )
}

export function TeamEvaluationPage() {
  const { id } = useParams()
  const [scores, setScores] = useState<Record<ScoreCriteriaKey, number>>({
    innovation: 0,
    technicalQuality: 0,
    aiUsage: 0,
    businessValue: 0,
    presentation: 0,
    bonus: 0,
  })
  const [comments, setComments] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const totalScore = Object.entries(scores).reduce((sum, [_, val]) => sum + val, 0)
  const maxScore = Object.values(SCORING_RUBRIC).reduce((sum, r) => sum + r.max, 0)

  const handleScoreChange = (key: ScoreCriteriaKey, val: number) => {
    setScores(prev => ({ ...prev, [key]: val }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
    }, 1500)
  }

  return (
    <DashboardLayout role="judge">
      <div className="h-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200/80 bg-[#F8FAFC]">
        
        {/* Left Column: Team Profile Details */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <div className="flex items-center gap-3">
            <Link to="/judge" className="p-2 rounded-xl text-slate-400 hover:text-[#0F172A] hover:bg-slate-100 transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider block">Round 1 Evaluation</span>
              <h1 className="font-display text-lg font-bold text-[#0F172A] tracking-tight">{mockTeam.teamName}</h1>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Project Title</span>
              <p className="text-sm font-bold text-[#0F172A]">{mockTeam.projectTitle}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Description</span>
              <p className="text-xs text-[#475569] leading-relaxed font-light">{mockTeam.projectDescription}</p>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Resource Transmissions</span>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Demo link', href: mockTeam.demoUrl, icon: ExternalLink },
                { label: 'Github Repository', href: mockTeam.githubUrl, icon: Github },
                { label: 'Slides Deck', href: mockTeam.presentationUrl, icon: ExternalLink }
              ].map(link => {
                const Icon = link.icon
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition-colors text-left"
                  >
                    <span className="text-[10px] font-bold text-[#475569]">{link.label}</span>
                    <Icon size={12} className="text-slate-400" />
                  </a>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Team Board ({mockTeam.members.length})</span>
            <div className="grid sm:grid-cols-2 gap-3">
              {mockTeam.members.map(member => (
                <div key={member.name} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <Avatar name={member.name} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#0F172A] truncate">{member.name}</p>
                    <p className="text-[9px] text-slate-400">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Dynamic Evaluation Form */}
        <div className="w-full md:w-[440px] p-6 overflow-y-auto bg-white/40 backdrop-blur-md flex flex-col justify-between">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Evaluation Sheet</span>
              <div className="text-right">
                <span className="font-display font-extrabold text-xl text-[#5B5CEB]">{totalScore}</span>
                <span className="text-xs text-slate-400">/{maxScore}</span>
              </div>
            </div>

            <div className="space-y-4">
              {CRITERIA_KEYS.map(key => {
                const spec = SCORING_RUBRIC[key]
                return (
                  <ScoreSlider
                    key={key}
                    label={spec.label}
                    max={spec.max}
                    description={spec.description}
                    value={scores[key]}
                    onChange={v => handleScoreChange(key, v)}
                  />
                )
              })}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Evaluation Verdict</label>
              <textarea
                value={comments}
                onChange={e => setComments(e.target.value)}
                placeholder="Include feedback or technical observations..."
                required
                rows={3}
                className="w-full text-xs text-[#0F172A] bg-white border border-slate-200 focus:border-slate-300 p-3 rounded-xl focus:outline-none resize-none shadow-sm placeholder:text-slate-300"
              />
            </div>

            <div className="pt-2">
              {submitted ? (
                <div className="p-3 bg-[#10B981]/5 border border-[#10B981]/15 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-[#10B981]">
                  Evaluation Loop Completed
                </div>
              ) : (
                <Button
                  type="submit"
                  loading={submitting}
                  fullWidth
                  size="md"
                  className="rounded-xl bg-[#5B5CEB] text-white hover:bg-[#5B5CEB]/90 font-bold shadow-sm"
                  rightIcon={<Send size={13} />}
                >
                  Submit Scoring Sheet
                </Button>
              )}
            </div>
          </form>
        </div>

      </div>
    </DashboardLayout>
  )
}
export default TeamEvaluationPage
