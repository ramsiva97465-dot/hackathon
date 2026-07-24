import { useState } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { containerVariants, itemVariants } from '@/lib/motion'
import { getTrackConfig } from '@/lib/utils'
import { Trophy, Users, Award, Eye, Plus } from 'lucide-react'

const teams = [
  {
    id: '1',
    name: 'SpeakSense',
    college: 'BITS Pilani',
    track: 'REAL_WORLD_DEPLOYMENT',
    members: [{ name: 'Arjun Singh' }, { name: 'Priya Nair' }],
    judgesAssigned: 2,
    totalJudges: 3,
    avgScore: 82.5,
    rank: 1,
    status: 'COMPETING',
  },
  {
    id: '2',
    name: 'AudioMind',
    college: 'VIT Chennai',
    track: 'VOICE_AI_AGENT',
    members: [{ name: 'Vikram Das' }, { name: 'Sana Kapoor' }, { name: 'Raj Rao' }],
    judgesAssigned: 2,
    totalJudges: 3,
    avgScore: 78.3,
    rank: 2,
    status: 'COMPETING',
  },
  {
    id: '3',
    name: 'NovaTalk',
    college: 'NIT Trichy',
    track: 'MULTIMODAL_AI',
    members: [{ name: 'Kiran Bose' }, { name: 'Meera Shah' }, { name: 'Dev Raj' }, { name: 'Aisha Khan' }],
    judgesAssigned: 1,
    totalJudges: 3,
    avgScore: null,
    rank: null,
    status: 'COMPETING',
  },
]

export function TeamsPage() {
  return (
    <DashboardLayout role="admin">
      <div className="p-6 space-y-6 max-w-[1400px]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">Teams</h1>
            <p className="text-sm text-slate-500">Approved teams competing in the hackathon</p>
          </div>
          <Button leftIcon={<Plus size={16} />} size="sm" className="bg-[#5B5CEB] hover:bg-[#4a4bcf]">Export</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Teams', value: teams.length, icon: Users },
            { label: 'Judging Complete', value: teams.filter(t => t.judgesAssigned >= t.totalJudges).length, icon: Award },
            { label: 'Ranked', value: teams.filter(t => t.rank !== null).length, icon: Trophy },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-[#5B5CEB]/10 border border-[#5B5CEB]/20 flex items-center justify-center">
                <s.icon size={18} className="text-[#5B5CEB]" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500 font-semibold">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Teams grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {teams.map(team => {
            const track = getTrackConfig(team.track)
            const judgeProgress = (team.judgesAssigned / team.totalJudges) * 100
            return (
              <motion.div key={team.id} variants={itemVariants} whileHover={{ y: -4 }} transition={{ duration: 0.25 }}>
                <div className="bg-white border border-slate-200 p-5 rounded-2xl h-full flex flex-col gap-4 hover:border-[#5B5CEB]/30 hover:shadow-sm transition-all duration-300">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {team.rank && (
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-sm ${team.rank === 1 ? 'rank-1' : team.rank === 2 ? 'rank-2' : 'rank-3'} text-black`}>
                          #{team.rank}
                        </div>
                      )}
                      <div>
                        <h3 className="font-display font-bold text-slate-900">{team.name}</h3>
                        <p className="text-xs text-slate-400 font-medium">{team.members.length === 1 ? 'Individual Participation' : 'Team Participation'}</p>
                      </div>
                    </div>
                    <span className="text-[11px] px-2 py-1 rounded-full font-semibold" style={{ background: track.bg, color: track.color }}>
                      {track.label}
                    </span>
                  </div>

                  {/* Members */}
                  <div className="flex items-center gap-2">
                    {team.members.map(m => (
                      <Avatar key={m.name} name={m.name} size="xs" />
                    ))}
                    <span className="text-xs text-slate-400 ml-1 font-medium">{team.members.length} members</span>
                  </div>

                  {/* Scoring progress */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-400 font-medium">Judges scored</span>
                      <span className="text-xs font-semibold text-slate-800">{team.judgesAssigned}/{team.totalJudges}</span>
                    </div>
                    <Progress value={judgeProgress} variant={judgeProgress === 100 ? 'success' : 'primary'} size="sm" />
                  </div>

                  {/* Score */}
                  {team.avgScore !== null && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#5B5CEB]/5 border border-[#5B5CEB]/10">
                      <span className="text-xs text-slate-500 font-semibold">Average Score</span>
                      <span className="font-display font-bold text-[#5B5CEB] text-lg">{team.avgScore.toFixed(1)}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto">
                    <Button size="xs" variant="ghost" fullWidth leftIcon={<Eye size={13} />}>View</Button>
                    <Button size="xs" variant="outline" fullWidth leftIcon={<Award size={13} />}>Assign Judge</Button>
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
