import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { containerVariants, itemVariants } from '@/lib/motion'
import { getTrackConfig } from '@/lib/utils'
import { CheckCircle, Clock, ArrowRight, Lock, Eye } from 'lucide-react'

const assignedTeams = [
  {
    id: '1',
    teamName: 'SpeakSense',
    college: 'BITS Pilani',
    track: 'REAL_WORLD_DEPLOYMENT',
    projectTitle: 'Multilingual Voice Commerce Agent',
    members: [{ name: 'Arjun Singh' }, { name: 'Priya Nair' }],
    isScored: true,
    isLocked: true,
    totalScore: 91.2,
    round: 'Round 1',
  },
  {
    id: '2',
    teamName: 'AudioMind',
    college: 'VIT Chennai',
    track: 'VOICE_AI_AGENT',
    projectTitle: 'Voice-First Customer Service AI',
    members: [{ name: 'Vikram Das' }, { name: 'Sana Kapoor' }, { name: 'Raj Rao' }],
    isScored: true,
    isLocked: false,
    totalScore: 88.7,
    round: 'Round 1',
  },
  {
    id: '3',
    teamName: 'NovaTalk',
    college: 'NIT Trichy',
    track: 'MULTIMODAL_AI',
    projectTitle: 'Multimodal AI Teaching Assistant',
    members: [{ name: 'Kiran Bose' }, { name: 'Meera Shah' }, { name: 'Dev Raj' }, { name: 'Aisha Khan' }],
    isScored: false,
    isLocked: false,
    totalScore: null,
    round: 'Round 1',
  },
  {
    id: '4',
    teamName: 'VoiceForge AI',
    college: 'IIT Madras',
    track: 'VOICE_AI_AGENT',
    projectTitle: 'Empathetic Voice Agent for Mental Health',
    members: [{ name: 'Ananya Kumar' }, { name: 'Rohan Patel' }, { name: 'Sneha Raj' }],
    isScored: false,
    isLocked: false,
    totalScore: null,
    round: 'Round 1',
  },
]

export function JudgeDashboard() {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const scored = assignedTeams.filter(t => t.isScored).length
  const total = assignedTeams.length
  
  const activeTeam = assignedTeams[selectedIdx]
  const track = getTrackConfig(activeTeam.track)

  return (
    <DashboardLayout role="judge">
      <div className="h-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200/80 bg-[#F8FAFC]">
        
        {/* Left Column: High-density list */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
            <div>
              <h1 className="font-display text-lg font-bold text-[#0F172A] tracking-tight">Assigned Submissions</h1>
              <p className="text-[11px] text-slate-400 font-light mt-0.5">Round 1 evaluations loops</p>
            </div>
            <div className="text-right">
              <span className="font-mono text-sm font-bold text-[#5B5CEB]">{scored}/{total} Scored</span>
              <span className="text-[10px] text-slate-400 font-light block mt-0.5">Progress</span>
            </div>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2.5"
          >
            {assignedTeams.map((team, idx) => {
              const active = idx === selectedIdx
              return (
                <motion.div
                  key={team.id}
                  variants={itemVariants}
                  onClick={() => setSelectedIdx(idx)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border text-left cursor-pointer transition-all duration-300 ${
                    active 
                      ? 'bg-white border-[#5B5CEB]/30 shadow-[0_10px_25px_rgba(15,23,42,0.03)]' 
                      : 'bg-transparent border-slate-200/60 hover:bg-white/40'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-xs text-[#0F172A] truncate block">{team.teamName}</span>
                      <span className="text-[9px] font-mono text-slate-400">{team.round}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate block font-light">{team.projectTitle}</span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {team.isScored ? (
                      <span className="text-xs font-bold text-[#10B981] flex items-center gap-1">
                        <CheckCircle size={13} /> {team.totalScore?.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-[#F59E0B] flex items-center gap-1">
                        <Clock size={13} /> Pending
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>

        {/* Right Column: Dynamic Preview & Actions */}
        <div className="w-full md:w-[420px] p-6 overflow-y-auto bg-white/40 backdrop-blur-md flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <span 
                className="text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider"
                style={{ background: `${track.color}10`, color: track.color, borderColor: `${track.color}15` }}
              >
                {track.label}
              </span>
              {activeTeam.isLocked && (
                <Badge variant="muted" size="sm"><Lock size={10} className="mr-1" />Locked</Badge>
              )}
            </div>

            <div className="space-y-1.5">
              <h2 className="font-display font-extrabold text-xl text-[#0F172A] tracking-tight">{activeTeam.teamName}</h2>
              <p className="text-xs text-slate-400 font-light">{activeTeam.college}</p>
            </div>

            <div className="border-t border-slate-200/60 pt-5 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Project Title</span>
              <p className="text-xs text-[#0F172A] leading-relaxed font-light">{activeTeam.projectTitle}</p>
            </div>

            <div className="border-t border-slate-200/60 pt-5 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Team Members ({activeTeam.members.length})</span>
              <div className="flex flex-wrap gap-2">
                {activeTeam.members.map(m => (
                  <div key={m.name} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
                    <Avatar name={m.name} size="xs" />
                    <span className="text-[10px] font-bold text-[#475569]">{m.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200/60 mt-8">
            {activeTeam.isScored && activeTeam.totalScore !== null ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-[#10B981]/5 border border-[#10B981]/15 p-4 rounded-xl">
                  <div>
                    <span className="text-[9px] text-[#94A3B8] uppercase tracking-wider block font-bold">Total Score</span>
                    <span className="text-lg font-display font-bold text-[#10B981]">{activeTeam.totalScore.toFixed(1)} / 100</span>
                  </div>
                  <CheckCircle size={18} className="text-[#10B981]" />
                </div>
                {!activeTeam.isLocked && (
                  <Link to={`/judge/team/${activeTeam.id}`}>
                    <Button fullWidth variant="outline" size="md" className="rounded-xl border-slate-200 font-bold hover:bg-slate-50">
                      Re-Evaluate Submission
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <Link to={`/judge/team/${activeTeam.id}`}>
                <Button fullWidth size="md" className="rounded-xl bg-[#5B5CEB] text-white hover:bg-[#5B5CEB]/90 font-bold shadow-sm" rightIcon={<ArrowRight size={14} />}>
                  Start Evaluation Loop
                </Button>
              </Link>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
export default JudgeDashboard
