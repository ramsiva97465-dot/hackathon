import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { containerVariants, itemVariants } from '@/lib/motion'
import { Award, Plus, Users, CheckCircle, Linkedin, Lock, Unlock, X, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

type Judge = {
  id: string
  name: string
  company: string | null
  title: string | null
  email: string
  assignedTeams: number
  completedScores: number
  totalTeams: number
  isActive: boolean
  expertise: string[]
}

export function JudgesPage() {
  const [judges, setJudges] = useState<Judge[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', password: '', company: '', designation: '' })
  const [submitting, setSubmitting] = useState(false)
  const [createdCreds, setCreatedCreds] = useState<{ name: string; email: string; password: string } | null>(null)

  // Allocated Teams modal state
  const [selectedJudgeForTeams, setSelectedJudgeForTeams] = useState<Judge | null>(null)
  const [assignedTeamsList, setAssignedTeamsList] = useState<any[]>([])
  const [loadingAssignedTeams, setLoadingAssignedTeams] = useState(false)

  const handleOpenTeamsModal = async (judge: Judge) => {
    setSelectedJudgeForTeams(judge)
    setLoadingAssignedTeams(true)
    setAssignedTeamsList([])
    try {
      const res = await api.judges.assignedTeams(judge.id)
      if (res.data?.success) {
        setAssignedTeamsList(res.data.data || [])
      } else {
        toast.error('Failed to fetch assigned teams')
      }
    } catch (err) {
      console.error('Failed to load assigned teams', err)
      toast.error('Failed to load allotted teams')
    } finally {
      setLoadingAssignedTeams(false)
    }
  }

  useEffect(() => {
    fetchJudges()
  }, [])

  const fetchJudges = async () => {
    try {
      setLoading(true)
      const res = await api.judges.list()
      if (res.data?.success) {
        setJudges(res.data.data)
      }
    } catch (err) {
      console.error('Failed to load judges', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteJudge = async (id: string) => {
    if (!window.confirm('Are you sure you want to completely delete this judge? This cannot be undone.')) return
    try {
      setLoading(true)
      const res = await api.judges.delete(id)
      if (res.data?.success === false) {
        toast.error(res.data.error || 'Failed to delete judge')
      } else {
        toast.success('Judge deleted successfully')
        fetchJudges()
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete judge')
    } finally {
      setLoading(false)
    }
  }

  const handleAddJudge = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await api.judges.create(formData)
      if (res.data?.success === false) {
        toast.error(res.data.error || 'Failed to add judge. Ensure password is at least 8 characters.')
        return
      }
      toast.success('Judge created successfully!')
      setCreatedCreds({
        name: formData.name,
        email: formData.email,
        password: formData.password || 'Judge@123'
      })
      setShowAddModal(false)
      setFormData({ name: '', email: '', password: '', company: '', designation: '' })
      fetchJudges()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'An unexpected error occurred')
      console.error('Failed to add judge', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="min-h-[calc(100vh-64px)] w-full">
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-white mb-1">Judges</h1>
              <p className="text-sm text-white/50 font-medium">Manage judge assignments and scoring progress</p>
            </div>
            <Button onClick={() => setShowAddModal(true)} leftIcon={<Plus size={16} />} size="sm" className="bg-[#E83C00] hover:bg-[#c93400] text-white">Add Judge</Button>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Judges', value: judges.length },
              { label: 'Active', value: judges.filter(j => j.isActive).length },
              { label: 'Completed Scoring', value: judges.filter(j => j.totalTeams > 0 && j.completedScores >= j.totalTeams).length },
            ].map(s => (
              <div key={s.label} className="border p-4 rounded-2xl shadow-2xl" style={{ backgroundColor: '#0A0A0A', borderColor: 'rgba(255,255,255,0.1)' }}>
                <p className="font-display text-3xl font-black text-white">{s.value}</p>
                <p className="text-xs text-slate-400 font-bold tracking-wide uppercase mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Judges grid */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-4 border-slate-800 border-t-[#E83C00] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm font-semibold text-slate-500">Loading judges...</p>
            </div>
          ) : judges.length === 0 ? (
            <div className="py-20 text-center">
              <Users size={40} className="mx-auto mb-4 opacity-20 text-slate-800" />
              <p className="text-sm font-bold text-slate-500">No judges found</p>
              <p className="text-xs text-slate-400 mt-1">Register some judges to assign them to teams.</p>
            </div>
          ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {judges.map(judge => {
              const progress = judge.totalTeams > 0
                ? Math.min(100, (judge.completedScores / judge.totalTeams) * 100)
                : 0
              return (
                <motion.div key={judge.id} variants={itemVariants} whileHover={{ y: -4 }} transition={{ duration: 0.25 }}>
                  <div className="p-6 rounded-[1.5rem] shadow-2xl transition-all duration-300 h-full flex flex-col gap-5 border"
                       style={{ backgroundColor: '#0A0A0A', borderColor: 'rgba(255,255,255,0.1)' }}>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar name={judge.name} size="md" status={judge.isActive ? 'online' : 'offline'} className="ring-2 ring-[#0A0A0A] shadow-sm" />
                        <div>
                          <h3 className="font-display font-black text-white text-base">{judge.name}</h3>
                          <p className="text-xs text-[#E83C00] font-bold">{judge.title}</p>
                          <p className="text-xs text-slate-400 font-medium">{judge.company}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={judge.isActive ? 'success' : 'muted'} size="sm" dot className={judge.isActive ? 'bg-emerald-100 text-emerald-800' : ''}>
                          {judge.isActive ? 'Active' : 'Offline'}
                        </Badge>
                        <button 
                          onClick={() => handleDeleteJudge(judge.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-500/10"
                          title="Delete Judge"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Expertise */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {judge.expertise.map(e => (
                        <span key={e} className="text-[10px] px-2 py-1 rounded-xl bg-[#111] border border-white/10 text-slate-300 font-bold shadow-sm">{e}</span>
                      ))}
                    </div>

                    {/* Progress */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400 font-bold">Scoring progress</span>
                        <span className="text-xs font-black text-white">{judge.completedScores}/{judge.totalTeams}</span>
                      </div>
                      <Progress value={progress} variant={progress === 100 ? 'success' : 'primary'} size="sm" className="bg-white/10" />
                    </div>

                    <div className="flex items-center justify-between gap-2 bg-[#111] px-3 py-1.5 rounded-xl border border-white/10 text-xs">
                      <div className="min-w-0">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Login Email</span>
                        <span className="text-[11px] text-slate-300 font-bold font-mono truncate block">{judge.email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const text = `Judge Login Credentials:\nURL: https://voiceathon.snapserve.ai/judge/login\nEmail: ${judge.email}`
                          navigator.clipboard.writeText(text)
                          toast.success(`Copied login email for ${judge.name}!`)
                        }}
                        className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-lg transition-colors shrink-0"
                      >
                        Copy Login
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto pt-2">
                      <Button
                        size="xs"
                        variant="outline"
                        fullWidth
                        leftIcon={<Users size={13} />}
                        onClick={() => handleOpenTeamsModal(judge)}
                        className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white bg-transparent cursor-pointer"
                      >
                        Teams ({judge.assignedTeams || 0})
                      </Button>
                      {progress === 100
                        ? <Button size="xs" variant="ghost" fullWidth leftIcon={<Lock size={13} />} className="text-slate-500 hover:bg-white/5 hover:text-white">Locked</Button>
                        : <Button size="xs" variant="ghost" fullWidth leftIcon={<Unlock size={13} />} className="text-[#E83C00] hover:bg-[#E83C00]/10">Unlock</Button>
                      }
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedJudgeForTeams && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-white/10 max-h-[85vh]"
              style={{ backgroundColor: '#0A0A0A' }}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-xl text-white">{selectedJudgeForTeams.name}'s Allotted Teams</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E83C00]/20 text-[#E83C00] font-bold text-xs border border-[#E83C00]/30">
                      {assignedTeamsList.length} Teams
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedJudgeForTeams.company ? `${selectedJudgeForTeams.company} • ` : ''}{selectedJudgeForTeams.email}
                  </p>
                </div>
                <button onClick={() => setSelectedJudgeForTeams(null)} className="p-2 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              {/* Teams List */}
              <div className="p-6 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
                {loadingAssignedTeams ? (
                  <div className="py-12 text-center text-slate-400 font-bold text-sm">Fetching allotted teams...</div>
                ) : assignedTeamsList.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 font-medium text-sm border border-dashed border-white/10 rounded-2xl">
                    No teams allotted to this judge yet.
                  </div>
                ) : (
                  assignedTeamsList.map((team, idx) => (
                    <div key={team.id || idx} className="p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-2 hover:border-white/20 transition-all">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-white/10 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-black text-white truncate">{team.teamName}</h4>
                            {team.tableNumber && (
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20 font-mono">
                                Table: {team.tableNumber}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${team.isScored
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {team.isScored ? `✅ Evaluated (${team.totalScore || 0} pts)` : '⏳ Pending'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 pt-1 space-y-1">
                        <p><strong className="text-slate-300">Project:</strong> {team.projectTitle}</p>
                        {team.agentPhoneNumber && (
                          <p><strong className="text-slate-300">Agent Hotline:</strong> <span className="font-mono text-emerald-400 font-bold">{team.agentPhoneNumber}</span></p>
                        )}
                        {team.track && (
                          <p><strong className="text-slate-300">Track:</strong> {team.track}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end">
                <Button variant="ghost" onClick={() => setSelectedJudgeForTeams(null)} className="hover:bg-white/10 text-slate-300 hover:text-white rounded-xl">
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-white/10"
              style={{ backgroundColor: '#0A0A0A' }}
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h3 className="font-black text-xl text-white">Add New Judge</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddJudge} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Full Name</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="w-full px-4 py-2.5 border border-white/10 rounded-xl text-sm outline-none focus:border-[#E83C00] focus:ring-1 focus:ring-[#E83C00]/20 bg-[#111] text-white placeholder:text-slate-600" placeholder="Jane Doe" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Email Address</label>
                  <input required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} type="email" className="w-full px-4 py-2.5 border border-white/10 rounded-xl text-sm outline-none focus:border-[#E83C00] focus:ring-1 focus:ring-[#E83C00]/20 bg-[#111] text-white placeholder:text-slate-600" placeholder="jane@example.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Temporary Password</label>
                  <input required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} type="password" className="w-full px-4 py-2.5 border border-white/10 rounded-xl text-sm outline-none focus:border-[#E83C00] focus:ring-1 focus:ring-[#E83C00]/20 bg-[#111] text-white placeholder:text-slate-600" placeholder="Set a secure password" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Company</label>
                    <input value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} type="text" className="w-full px-4 py-2.5 border border-white/10 rounded-xl text-sm outline-none focus:border-[#E83C00] focus:ring-1 focus:ring-[#E83C00]/20 bg-[#111] text-white placeholder:text-slate-600" placeholder="Google" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Designation</label>
                    <input value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} type="text" className="w-full px-4 py-2.5 border border-white/10 rounded-xl text-sm outline-none focus:border-[#E83C00] focus:ring-1 focus:ring-[#E83C00]/20 bg-[#111] text-white placeholder:text-slate-600" placeholder="Sr. Engineer" />
                  </div>
                </div>
                
                <div className="pt-6 mt-2 border-t border-white/10 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)} className="hover:bg-white/10 text-slate-400 hover:text-white">Cancel</Button>
                  <Button type="submit" loading={submitting} className="bg-[#E83C00] hover:bg-[#c93400] text-white shadow-lg shadow-orange-900/10 rounded-xl px-6">Create Judge</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Credentials Created Popup Modal */}
        {createdCreds && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-emerald-500/30"
              style={{ backgroundColor: '#0A0A0A' }}
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10 bg-emerald-500/10">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-emerald-400" size={20} />
                  <h3 className="font-black text-lg text-white">Judge Credentials Created</h3>
                </div>
                <button onClick={() => setCreatedCreds(null)} className="p-1 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-300">
                  Share these login credentials with <strong className="text-white">{createdCreds.name}</strong> so they can log in to the Judge Panel.
                </p>
                <div className="p-4 bg-[#111] rounded-2xl border border-white/10 space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-sans font-bold">Judge Login URL</span>
                    <span className="text-emerald-400 font-bold select-all">https://voiceathon.snapserve.ai/judge/login</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-sans font-bold">Email / Username</span>
                    <span className="text-white font-bold select-all">{createdCreds.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-sans font-bold">Password</span>
                    <span className="text-amber-400 font-bold select-all">{createdCreds.password}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    fullWidth
                    onClick={() => {
                      const text = `Judge Login Credentials:\nURL: https://voiceathon.snapserve.ai/judge/login\nEmail: ${createdCreds.email}\nPassword: ${createdCreds.password}`
                      navigator.clipboard.writeText(text)
                      toast.success('Credentials copied to clipboard!')
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2.5 font-bold"
                  >
                    Copy Credentials
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCreatedCreds(null)}
                    className="hover:bg-white/10 text-slate-400 hover:text-white rounded-xl"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
