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
      <div className="min-h-[calc(100vh-64px)] w-full" style={{ backgroundColor: '#EBE3D5' }}>
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-[#1A1A1A] mb-1">Judges</h1>
              <p className="text-sm text-slate-500 font-medium">Manage judge assignments and scoring progress</p>
            </div>
            <Button onClick={() => setShowAddModal(true)} leftIcon={<Plus size={16} />} size="sm" className="bg-[#E83C00] hover:bg-[#c93400] text-white">Add Judge</Button>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Judges', value: judges.length },
              { label: 'Active', value: judges.filter(j => j.isActive).length },
              { label: 'Completed Scoring', value: judges.filter(j => j.completedScores >= j.totalTeams).length },
            ].map(s => (
              <div key={s.label} className="border p-4 rounded-xl shadow-sm" style={{ backgroundColor: '#F4ECE1', borderColor: '#EAE4D8' }}>
                <p className="font-display text-3xl font-black text-[#1A1A1A]">{s.value}</p>
                <p className="text-xs text-slate-500 font-bold tracking-wide uppercase mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Judges grid */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-4 border-[#EAE4D8] border-t-[#E83C00] rounded-full animate-spin mx-auto mb-4"></div>
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
              const progress = (judge.completedScores / judge.totalTeams) * 100 || 0
              return (
                <motion.div key={judge.id} variants={itemVariants} whileHover={{ y: -4 }} transition={{ duration: 0.25 }}>
                  <div className="p-6 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col gap-5 border"
                       style={{ backgroundColor: '#F4ECE1', borderColor: '#EAE4D8' }}>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar name={judge.name} size="md" status={judge.isActive ? 'online' : 'offline'} className="ring-2 ring-[#F4ECE1] shadow-sm" />
                        <div>
                          <h3 className="font-display font-black text-[#1A1A1A] text-base">{judge.name}</h3>
                          <p className="text-xs text-[#E83C00] font-bold">{judge.title}</p>
                          <p className="text-xs text-slate-500 font-medium">{judge.company}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={judge.isActive ? 'success' : 'muted'} size="sm" dot className={judge.isActive ? 'bg-emerald-100 text-emerald-800' : ''}>
                          {judge.isActive ? 'Active' : 'Offline'}
                        </Badge>
                        <button 
                          onClick={() => handleDeleteJudge(judge.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50"
                          title="Delete Judge"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Expertise */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {judge.expertise.map(e => (
                        <span key={e} className="text-[10px] px-2 py-1 rounded-xl bg-white border border-[#EAE4D8] text-slate-600 font-bold shadow-sm">{e}</span>
                      ))}
                    </div>

                    {/* Progress */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500 font-bold">Scoring progress</span>
                        <span className="text-xs font-black text-[#1A1A1A]">{judge.completedScores}/{judge.totalTeams}</span>
                      </div>
                      <Progress value={progress} variant={progress === 100 ? 'success' : 'primary'} size="sm" className="bg-[#EAE4D8]" />
                    </div>

                    {/* Email */}
                    <p className="text-[11px] text-slate-400 font-bold font-mono bg-white/50 px-2 py-1 rounded w-max border border-[#EAE4D8]">{judge.email}</p>

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto pt-2">
                      <Button size="xs" variant="outline" fullWidth leftIcon={<Users size={13} />} className="border-[#EAE4D8] text-slate-600 hover:bg-white bg-transparent">Teams</Button>
                      {progress === 100
                        ? <Button size="xs" variant="ghost" fullWidth leftIcon={<Lock size={13} />} className="text-slate-500 hover:bg-black/5">Locked</Button>
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
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-[#EAE4D8]"
              style={{ backgroundColor: '#F4ECE1' }}
            >
              <div className="flex items-center justify-between p-6 border-b border-[#EAE4D8]">
                <h3 className="font-black text-xl text-[#1A1A1A]">Add New Judge</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 rounded-xl text-slate-400 hover:bg-black/5"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddJudge} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Full Name</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="w-full px-4 py-2.5 border border-[#EAE4D8] rounded-xl text-sm outline-none focus:border-[#E83C00] focus:ring-1 focus:ring-[#E83C00]/20 bg-white" placeholder="Jane Doe" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Email Address</label>
                  <input required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} type="email" className="w-full px-4 py-2.5 border border-[#EAE4D8] rounded-xl text-sm outline-none focus:border-[#E83C00] focus:ring-1 focus:ring-[#E83C00]/20 bg-white" placeholder="jane@example.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Temporary Password</label>
                  <input required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} type="password" className="w-full px-4 py-2.5 border border-[#EAE4D8] rounded-xl text-sm outline-none focus:border-[#E83C00] focus:ring-1 focus:ring-[#E83C00]/20 bg-white" placeholder="Set a secure password" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Company</label>
                    <input value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} type="text" className="w-full px-4 py-2.5 border border-[#EAE4D8] rounded-xl text-sm outline-none focus:border-[#E83C00] focus:ring-1 focus:ring-[#E83C00]/20 bg-white" placeholder="Google" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Designation</label>
                    <input value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} type="text" className="w-full px-4 py-2.5 border border-[#EAE4D8] rounded-xl text-sm outline-none focus:border-[#E83C00] focus:ring-1 focus:ring-[#E83C00]/20 bg-white" placeholder="Sr. Engineer" />
                  </div>
                </div>
                
                <div className="pt-6 mt-2 border-t border-[#EAE4D8] flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)} className="hover:bg-black/5 text-slate-600">Cancel</Button>
                  <Button type="submit" loading={submitting} className="bg-[#E83C00] hover:bg-[#c93400] text-white shadow-lg shadow-orange-900/10 rounded-xl px-6">Create Judge</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
