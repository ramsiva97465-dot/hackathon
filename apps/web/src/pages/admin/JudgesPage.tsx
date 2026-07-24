import { useState } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { containerVariants, itemVariants } from '@/lib/motion'
import { Award, Plus, Users, CheckCircle, Linkedin, Lock, Unlock } from 'lucide-react'

const judges = [
  {
    id: '1',
    name: 'Priya Rajan',
    company: 'Google India',
    title: 'Head of AI',
    email: 'priya@google.com',
    assignedTeams: 4,
    completedScores: 4,
    totalTeams: 4,
    isActive: true,
    expertise: ['Voice AI', 'NLP'],
  },
  {
    id: '2',
    name: 'Arjun Mehta',
    company: 'Sarvam AI',
    title: 'CTO',
    email: 'arjun@sarvam.ai',
    assignedTeams: 4,
    completedScores: 2,
    totalTeams: 4,
    isActive: true,
    expertise: ['Indic AI', 'Startup'],
  },
  {
    id: '3',
    name: 'Deepa Krishnan',
    company: 'ElevenLabs',
    title: 'VP Engineering',
    email: 'deepa@elevenlabs.io',
    assignedTeams: 3,
    completedScores: 0,
    totalTeams: 4,
    isActive: false,
    expertise: ['Voice Synthesis', 'Neural TTS'],
  },
]

export function JudgesPage() {
  return (
    <DashboardLayout role="admin">
      <div className="p-6 space-y-6 max-w-[1400px]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">Judges</h1>
            <p className="text-sm text-slate-500">Manage judge assignments and scoring progress</p>
          </div>
          <Button leftIcon={<Plus size={16} />} size="sm" className="bg-[#5B5CEB] hover:bg-[#4a4bcf]">Add Judge</Button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Judges', value: judges.length },
            { label: 'Active', value: judges.filter(j => j.isActive).length },
            { label: 'Completed Scoring', value: judges.filter(j => j.completedScores >= j.totalTeams).length },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <p className="font-display text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Judges grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {judges.map(judge => {
            const progress = (judge.completedScores / judge.totalTeams) * 100
            return (
              <motion.div key={judge.id} variants={itemVariants} whileHover={{ y: -4 }} transition={{ duration: 0.25 }}>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-[#5B5CEB]/30 hover:shadow-sm transition-all duration-300 h-full flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={judge.name} size="md" status={judge.isActive ? 'online' : 'offline'} />
                      <div>
                        <h3 className="font-display font-bold text-slate-900 text-sm">{judge.name}</h3>
                        <p className="text-xs text-[#5B5CEB] font-semibold">{judge.title}</p>
                        <p className="text-xs text-slate-500 font-semibold">{judge.company}</p>
                      </div>
                    </div>
                    <Badge variant={judge.isActive ? 'success' : 'muted'} size="sm" dot>
                      {judge.isActive ? 'Active' : 'Offline'}
                    </Badge>
                  </div>

                  {/* Expertise */}
                  <div className="flex flex-wrap gap-1.5">
                    {judge.expertise.map(e => (
                      <span key={e} className="text-[10px] px-2 py-0.5 rounded-full bg-[#5B5CEB]/10 text-[#5B5CEB] border border-[#5B5CEB]/15 font-semibold">{e}</span>
                    ))}
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400 font-medium">Scoring progress</span>
                      <span className="text-xs font-semibold text-slate-800">{judge.completedScores}/{judge.totalTeams}</span>
                    </div>
                    <Progress value={progress} variant={progress === 100 ? 'success' : 'primary'} size="sm" />
                  </div>

                  {/* Email */}
                  <p className="text-xs text-slate-400 font-medium font-mono">{judge.email}</p>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto">
                    <Button size="xs" variant="outline" fullWidth leftIcon={<Users size={13} />}>Teams</Button>
                    {progress === 100
                      ? <Button size="xs" variant="ghost" fullWidth leftIcon={<Lock size={13} />}>Locked</Button>
                      : <Button size="xs" variant="ghost" fullWidth leftIcon={<Unlock size={13} />}>Unlock</Button>
                    }
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
