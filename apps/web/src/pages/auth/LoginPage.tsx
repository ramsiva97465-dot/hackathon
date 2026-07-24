import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { signIn } from '@/lib/auth-client'
import { toast } from 'sonner'
import { ShieldCheck, Mail, Lock, Award, KeyRound } from 'lucide-react'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const isAdminPath = location.pathname === '/admin-login'
  const isJudgePath = location.pathname === '/judge-login'

  let pageTitle = 'Enterprise Log In'
  let pageDesc = 'Access secure admin panels and scoring boards.'
  let PageIcon = ShieldCheck

  if (isAdminPath) {
    pageTitle = 'Admin Portal Login'
    pageDesc = 'Sign in to manage track parameters and team registrations.'
    PageIcon = KeyRound
  } else if (isJudgePath) {
    pageTitle = 'Judge Portal Login'
    pageDesc = 'Sign in to access hackathon metrics and scoring sheets.'
    PageIcon = Award
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

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
    } catch (err) {
      toast.error('An unexpected error occurred.')
    } finally {
      loading && setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] px-4 relative overflow-hidden">
      {/* Dynamic ambient background spotlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#6366F1]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-[#22D3EE]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 grid-mesh opacity-10 pointer-events-none" />

      <Card variant="glass" className="w-full max-w-md p-8 border border-white/5 rounded-2xl relative z-10 bg-[#0B1220]/45 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <CardHeader className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6366F1]/10 to-[#8B5CF6]/5 border border-white/5 flex items-center justify-center text-[#22D3EE] mx-auto mb-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
            <PageIcon size={22} />
          </div>
          <CardTitle className="font-display font-bold text-2xl text-white tracking-tighter">{pageTitle}</CardTitle>
          <CardDescription className="text-xs text-[#94A3B8] mt-1 font-light">
            {pageDesc}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="admin@theaitel.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail size={15} className="text-[#94A3B8]" />}
              className="bg-[#111827]/40 border-white/5 focus:border-[#6366F1]/50 text-white rounded-xl text-xs"
            />

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] font-bold text-[#CBD5E1] uppercase tracking-wider">Password</span>
                <Link to="/forgot-password" className="text-[11px] font-bold text-[#22D3EE] hover:underline uppercase tracking-wider">
                  Forgot?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                leftIcon={<Lock size={15} className="text-[#94A3B8]" />}
                className="bg-[#111827]/40 border-white/5 focus:border-[#6366F1]/50 text-white rounded-xl text-xs"
              />
            </div>

            <div className="pt-3">
              <Button type="submit" loading={loading} fullWidth size="md" className="rounded-xl font-bold">
                Sign In to Platform
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
export default LoginPage
