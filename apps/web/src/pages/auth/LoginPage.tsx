import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { BrandPair } from '@/components/brand/BrandLogos'
import { signIn } from '@/lib/auth-client'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Mail, Lock, ArrowRight } from 'lucide-react'

function LoginFields({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  onSubmit,
  emailPlaceholder,
  title,
  desc,
  cta,
  showPassword = true,
}: {
  email: string
  setEmail: (v: string) => void
  password?: string
  setPassword?: (v: string) => void
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
  emailPlaceholder: string
  title: string
  desc: string
  cta: string
  showPassword?: boolean
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-1 text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-[13px] text-slate-500 font-normal leading-relaxed">{desc}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder={emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          leftIcon={<Mail size={15} className="text-slate-400" />}
          className="bg-[#F8FAFC] border-slate-200 focus:border-[#E83C00]/50 focus:ring-[#E83C00]/10 text-slate-900 placeholder:text-slate-400 rounded-xl text-sm sm:text-xs h-12 sm:h-11"
        />

        {showPassword && setPassword && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-0.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Password</span>
              <Link
                to="/forgot-password"
                className="text-[11px] font-semibold text-[#E83C00] hover:text-[#E83C00]/80 uppercase tracking-wider transition-colors"
              >
                Forgot?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              leftIcon={<Lock size={15} className="text-slate-400" />}
              className="bg-[#F8FAFC] border-slate-200 focus:border-[#E83C00]/50 focus:ring-[#E83C00]/10 text-slate-900 placeholder:text-slate-400 rounded-xl text-sm sm:text-xs h-12 sm:h-11"
            />
          </div>
        )}

        <div className="pt-1">
          <Button
            type="submit"
            loading={loading}
            fullWidth
            size="md"
            className="h-12 sm:h-11 rounded-xl font-semibold text-sm sm:text-xs bg-[#E83C00] hover:bg-[#E83C00]/90 text-white border-transparent shadow-sm hover:shadow-[0_8px_20px_rgba(232,60,0,0.25)]"
            rightIcon={!loading ? <ArrowRight size={14} /> : undefined}
          >
            {cta}
          </Button>
        </div>
      </form>
    </div>
  )
}

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const isAdminPath = location.pathname === '/admin-login'
  const isJudgePath = location.pathname === '/judge-login'
  const isParticipantPath = !isAdminPath && !isJudgePath

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (isParticipantPath) {
      try {
        const res = await api.auth.participantLogin(email)
        if (res.data?.success) {
          toast.success('Successfully logged in!')
          localStorage.setItem('auth_token', res.data.token)
          navigate('/participant')
        } else {
          toast.error(res.data?.error || 'Login failed.')
        }
      } catch (err: any) {
        console.error(err)
        toast.error(err.response?.data?.message || 'Email is not registered in any team.')
      } finally {
        setLoading(false)
      }
      return
    }

    try {
      const { data, error } = await signIn.email({
        email,
        password,
      })

      if (error) {
        toast.error(error.message || 'Login failed. Please check credentials.')
      } else {
        toast.success('Successfully logged in!')
        const role = (data as any)?.user?.role
        if (role === 'JUDGE') {
          navigate('/judge')
        } else {
          navigate('/admin')
        }
      }
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const roleLabel = isJudgePath ? 'Judge Access' : isAdminPath ? 'Admin Access' : 'Participant Access'
  const title = isJudgePath ? 'Judge Panel' : isAdminPath ? 'Admin Portal' : 'Participant Desk'
  const desc = isJudgePath
    ? 'Sign in on your phone or laptop to score assigned teams.'
    : isAdminPath
      ? 'Manage applications, teams, and event operations.'
      : 'Enter your registered email to access your team dashboard.'
  const emailPlaceholder = isJudgePath ? 'judge@theaitel.com' : isAdminPath ? 'admin@theaitel.com' : 'you@example.com'
  const cta = isJudgePath ? 'Enter Judge Desk' : isAdminPath ? 'Sign In' : 'Enter Portal'

  return (
    <div
      className="min-h-screen min-h-[100dvh] bg-[#F4F6F8] text-[#0F172A] flex flex-col items-center justify-center py-6 px-4 sm:py-10 relative overflow-x-hidden"
      style={{
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        letterSpacing: '-0.011em',
        backgroundImage:
          'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(232,60,0,0.07), transparent 55%), radial-gradient(ellipse 40% 30% at 90% 80%, rgba(6,182,212,0.05), transparent 50%)',
      }}
    >
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[min(520px,90vw)] h-[280px] rounded-full bg-[#E83C00]/[0.06] blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[400px] sm:max-w-[420px] relative z-10"
      >
        <div className="bg-white/95 border border-slate-200/90 rounded-[22px] sm:rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-sm">
          <div
            className="relative px-5 pt-7 pb-6 sm:px-6 sm:pt-8 sm:pb-7 flex flex-col items-center gap-4 overflow-hidden"
            style={{
              backgroundColor: '#090D16',
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 0)',
              backgroundSize: '16px 16px',
            }}
          >
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-36 h-36 bg-[#06B6D4]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-36 h-36 bg-[#E83C00]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <BrandPair size="sm" tone="dark" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-2 px-1">
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-[0.16em] sm:tracking-[0.2em] text-white/90 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full uppercase text-center">
                AI Voice Voiceathon 2026
              </span>
              {roleLabel && (
                <span className="text-[9px] sm:text-[10px] font-semibold tracking-[0.16em] text-[#E83C00] bg-[#E83C00]/10 border border-[#E83C00]/25 px-3 py-1 rounded-full uppercase">
                  {roleLabel}
                </span>
              )}
            </div>
          </div>

          <div className="p-5 sm:p-8 bg-white">
            <LoginFields
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              loading={loading}
              onSubmit={handleLogin}
              emailPlaceholder={emailPlaceholder}
              title={title}
              desc={desc}
              cta={cta}
              showPassword={!isParticipantPath}
            />

            {/* Toggle Role Links */}
            <div className="mt-4 text-center">
              {isParticipantPath ? (
                <Link
                  to="/judge-login"
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 tracking-wide uppercase transition-colors"
                >
                  Are you an Organizer or Judge? <span className="text-[#E83C00] underline">Log in here</span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 tracking-wide uppercase transition-colors"
                >
                  Are you a Participant? <span className="text-[#E83C00] underline">Log in here</span>
                </Link>
              )}
            </div>

            <p className="mt-6 text-center text-[10px] sm:text-[11px] text-slate-400 font-normal leading-relaxed">
              Hosted by{' '}
              <a href="https://snapserve.ai" target="_blank" rel="noreferrer" className="font-semibold text-slate-600 hover:text-slate-900">
                snapserve.ai
              </a>
              {' · '}
              Sponsored by{' '}
              <a href="https://www.vobiz.ai" target="_blank" rel="noreferrer" className="font-semibold text-[#E83C00] hover:text-[#E83C00]/80">
                vobiz.ai
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginPage

