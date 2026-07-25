import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { containerVariants, itemVariants } from '@/lib/motion'
import { getTrackConfig } from '@/lib/utils'
import {
  Trophy, Users, Award, X, Check,
  Search, Hash, Star, UserPlus
} from 'lucide-react'
import { api } from '@/lib/api'

type Team = {
  id: string; name: string; college: string; track: string
  members: { name: string; avatar?: string }[]
  judgesAssigned: number; totalJudges: number
  avgScore: number | null; rank: number | null
  status: string; tableNumber: string | null
}

type Judge = {
  id: string; name: string; email: string; avatar: string | null
  company: string | null; designation: string | null; assignmentsCount: number
}

const RANK_STYLE: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: 'linear-gradient(135deg,#F59E0B,#D97706)', text: '#fff', label: '🥇' },
  2: { bg: 'linear-gradient(135deg,#94A3B8,#64748B)', text: '#fff', label: '🥈' },
  3: { bg: 'linear-gradient(135deg,#CD7F32,#92400E)', text: '#fff', label: '🥉' },
}

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [judges, setJudges] = useState<Judge[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [assignTarget, setAssignTarget] = useState<Team | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [editingTableId, setEditingTableId] = useState<string | null>(null)
  const [editingTableValue, setEditingTableValue] = useState('')
  const [savingTable, setSavingTable] = useState(false)

  useEffect(() => { fetchTeams(); fetchJudges() }, [])

  const fetchTeams = async () => {
    try {
      setLoading(true)
      const res = await api.teams.list()
      if (res.data?.success) setTeams(res.data.data)
    } catch (err) { console.error('Failed to load teams', err) }
    finally { setLoading(false) }
  }

  const fetchJudges = async () => {
    try {
      const res = await api.judges.list()
      if (res.data?.success) setJudges(res.data.data)
    } catch (err) { console.error('Failed to load judges', err) }
  }

  const handleAssignJudge = async (judgeId: string) => {
    if (!assignTarget) return
    try {
      setAssigning(true)
      await api.teams.assignJudge(assignTarget.id, judgeId, 'round1')
      await fetchTeams()
      setAssignTarget(null)
    } catch (err) { console.error('Failed to assign judge', err) }
    finally { setAssigning(false) }
  }

  const handleSaveTableNumber = async (teamId: string) => {
    try {
      setSavingTable(true)
      await api.teams.updateTableNumber(teamId, editingTableValue)
      await fetchTeams()
      setEditingTableId(null)
    } catch (err) { console.error('Failed to update table number', err) }
    finally { setSavingTable(false) }
  }

  const filtered = teams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.college?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = [
    { label: 'Total Teams',      value: teams.length,                                       icon: Users,  color: '#E83C00', bg: 'rgba(232,60,0,0.07)',    border: 'rgba(232,60,0,0.15)'    },
    { label: 'Judging Complete', value: teams.filter(t => t.judgesAssigned >= t.totalJudges && t.totalJudges > 0).length, icon: Award,  color: '#10B981', bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.15)' },
    { label: 'On Leaderboard',   value: teams.filter(t => t.rank !== null).length,           icon: Trophy, color: '#8B5CF6', bg: 'rgba(139,92,246,0.07)', border: 'rgba(139,92,246,0.15)' },
  ]

  return (
    <DashboardLayout role="admin">
      <div className="p-6 max-w-[1400px] space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Teams</h1>
            <p className="text-sm text-slate-500 mt-0.5">All approved teams competing in the hackathon.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {stats.map(({ icon: Icon, label, value, color, border }) => (
              <div key={label} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white"
                style={{ border: `1.5px solid ${border}` }}>
                <Icon size={14} style={{ color }} />
                <span className="text-sm font-bold text-slate-900">{value}</span>
                <span className="text-xs text-slate-400 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Search + Table Card ── */}
        <div className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1.5px solid #EEF2F7', boxShadow: '0 2px 12px rgba(15,23,42,0.05)' }}>

          {/* Search Bar */}
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid #F1F5F9' }}>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search teams or college…"
                className="pl-9 pr-4 py-2 text-sm rounded-xl outline-none transition-all w-64"
                style={{ border: '1.5px solid #EEF2F7', background: '#F8FAFC', color: '#0F172A' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(232,60,0,0.35)'; e.currentTarget.style.background = '#fff' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#EEF2F7'; e.currentTarget.style.background = '#F8FAFC' }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-400">{filtered.length} teams</span>
          </div>

          {/* Column Headers */}
          <div className="grid px-5 py-3"
            style={{
              gridTemplateColumns: '2fr 1.5fr 1fr 0.8fr 1fr 1.2fr 110px',
              background: '#F8FAFC',
              borderBottom: '1px solid #F1F5F9',
            }}>
            {['Team', 'College', 'Track', 'Table', 'Members', 'Judging', 'Actions'].map(col => (
              <span key={col} className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{col}</span>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            <div className="py-24 text-center">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-[#E83C00] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-semibold text-slate-400">Loading teams…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: '#F8FAFC', border: '1.5px solid #EEF2F7' }}>
                <Users size={28} style={{ color: '#CBD5E1' }} />
              </div>
              <p className="text-sm font-semibold text-slate-400">No teams found</p>
              <p className="text-xs text-slate-300 mt-1">Try a different search or approve applications first.</p>
            </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              {filtered.map((team, idx) => {
                const track = getTrackConfig(team.track)
                const judgeProgress = team.totalJudges > 0 ? (team.judgesAssigned / team.totalJudges) * 100 : 0
                const isLast = idx === filtered.length - 1
                const rankStyle = team.rank && team.rank <= 3 ? RANK_STYLE[team.rank] : null

                return (
                  <motion.div
                    key={team.id}
                    variants={itemVariants}
                    className="grid px-5 py-4 items-center transition-colors cursor-default"
                    style={{
                      gridTemplateColumns: '2fr 1.5fr 1fr 0.8fr 1fr 1.2fr 110px',
                      borderBottom: isLast ? 'none' : '1px solid #F8FAFC',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFC')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Team */}
                    <div className="flex items-center gap-3 min-w-0">
                      {rankStyle ? (
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                          style={{ background: rankStyle.bg }}>
                          {rankStyle.label}
                        </div>
                      ) : team.rank ? (
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0"
                          style={{ background: '#F1F5F9', color: '#94A3B8' }}>
                          #{team.rank}
                        </div>
                      ) : null}
                      <Avatar name={team.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{team.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {team.members.length === 1 ? 'Solo' : `${team.members.length} members`}
                        </p>
                      </div>
                    </div>

                    {/* College */}
                    <p className="text-xs text-slate-600 font-medium truncate pr-2">{team.college || '—'}</p>

                    {/* Track */}
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full w-fit"
                      style={{ background: track.bg, color: track.color, border: `1px solid ${track.color}22` }}>
                      {track.label}
                    </span>

                    {/* Table Number */}
                    <div>
                      {editingTableId === team.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus
                            value={editingTableValue}
                            onChange={e => setEditingTableValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSaveTableNumber(team.id)}
                            className="w-14 px-2 py-1 text-xs font-bold rounded-lg outline-none transition-all"
                            style={{ border: '1.5px solid rgba(232,60,0,0.4)', background: '#fff' }}
                          />
                          <button disabled={savingTable} onClick={() => handleSaveTableNumber(team.id)}
                            className="text-emerald-500 hover:text-emerald-700 transition-colors">
                            <Check size={13} />
                          </button>
                          <button disabled={savingTable} onClick={() => setEditingTableId(null)}
                            className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-1.5 group cursor-pointer w-fit px-2 py-1 rounded-lg transition-all"
                          onClick={() => { setEditingTableId(team.id); setEditingTableValue(team.tableNumber || '') }}
                          style={{ border: '1px solid transparent' }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(232,60,0,0.2)')}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
                        >
                          <Hash size={11} className="text-slate-300 group-hover:text-[#E83C00] transition-colors" />
                          <span className="text-sm font-bold text-slate-700 group-hover:text-[#E83C00] transition-colors">
                            {team.tableNumber || <span className="text-slate-300 text-xs font-medium">—</span>}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Members Avatars */}
                    <div className="flex items-center -space-x-2">
                      {team.members.slice(0, 4).map(m => (
                        <div key={m.name} className="ring-2 ring-white rounded-full">
                          <Avatar name={m.name} size="xs" />
                        </div>
                      ))}
                      {team.members.length > 4 && (
                        <div className="w-6 h-6 rounded-full bg-slate-100 ring-2 ring-white flex items-center justify-center text-[9px] font-bold text-slate-500">
                          +{team.members.length - 4}
                        </div>
                      )}
                    </div>

                    {/* Judging */}
                    <div className="pr-3">
                      {team.avgScore !== null ? (
                        <div className="flex items-center gap-1.5">
                          <Star size={13} className="text-amber-400 fill-amber-400" />
                          <span className="text-sm font-black text-slate-800">{team.avgScore.toFixed(1)}</span>
                          <span className="text-[10px] text-slate-400 font-medium">avg</span>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                            <span>Judges</span>
                            <span>{team.judgesAssigned}/{team.totalJudges}</span>
                          </div>
                          <Progress value={judgeProgress} variant={judgeProgress === 100 ? 'success' : 'primary'} size="sm" />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAssignTarget(team)}
                        className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all"
                        style={{ color: '#E83C00', background: 'rgba(232,60,0,0.06)', border: '1px solid rgba(232,60,0,0.15)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,60,0,0.12)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(232,60,0,0.06)')}
                      >
                        <UserPlus size={11} /> Assign
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Assign Judge Modal ── */}
      <AnimatePresence>
        {assignTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(8,13,28,0.72)', backdropFilter: 'blur(6px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.28 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col"
              style={{ maxHeight: '85vh', border: '1px solid #E2E8F0', boxShadow: '0 24px 64px rgba(0,0,0,0.14)' }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid #F1F5F9' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(232,60,0,0.08)', border: '1px solid rgba(232,60,0,0.18)' }}>
                    <UserPlus size={16} style={{ color: '#E83C00' }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Assign Judge</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Evaluating <span className="font-semibold text-slate-700">{assignTarget.name}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAssignTarget(null)}
                  className="p-2 rounded-xl transition-colors text-slate-400"
                  style={{ border: '1px solid transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#EEF2F7' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Judge List */}
              <div className="p-4 overflow-y-auto flex-1 space-y-2">
                {judges.length === 0 ? (
                  <div className="text-center py-10">
                    <Award size={28} className="mx-auto mb-3 text-slate-200" />
                    <p className="text-sm font-semibold text-slate-400">No judges available</p>
                  </div>
                ) : judges.map(judge => (
                  <div
                    key={judge.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border transition-all"
                    style={{ border: '1.5px solid #EEF2F7', background: '#FAFAFA' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(232,60,0,0.22)'; e.currentTarget.style.background = 'rgba(232,60,0,0.02)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#EEF2F7'; e.currentTarget.style.background = '#FAFAFA' }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={judge.name} size="sm" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{judge.name}</p>
                        <p className="text-xs text-slate-500 font-medium">
                          {judge.company || 'Independent'} · <span className="font-semibold">{judge.assignmentsCount}</span> assigned
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAssignJudge(judge.id)}
                      disabled={assigning}
                      className="text-[11px] font-bold px-3.5 py-1.5 rounded-lg transition-all disabled:opacity-50"
                      style={{ color: '#E83C00', background: 'rgba(232,60,0,0.07)', border: '1px solid rgba(232,60,0,0.18)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,60,0,0.14)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(232,60,0,0.07)')}
                    >
                      {assigning ? '…' : 'Assign'}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
