import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'
import { Mail, ArrowLeft, KeyRound } from 'lucide-react'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await (authClient as any).forgetPassword({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        toast.error(error.message || 'Failed to process request.')
      } else {
        toast.success('Reset link sent to your email!')
        setSent(true)
      }
    } catch (err) {
      toast.error('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <Card variant="glass" className="w-full max-w-md p-8 border border-white/5 rounded-2xl relative z-10">
        <CardHeader className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto mb-4">
            <KeyRound size={24} />
          </div>
          <CardTitle className="font-display font-bold text-2xl text-white">Reset Password</CardTitle>
          <CardDescription className="text-xs text-muted mt-1">
            Send a secure password reset token to your email
          </CardDescription>
        </CardHeader>

        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted">
                A verification link has been sent to <strong className="text-white">{email}</strong>. Please check your inbox and click the link to reset your credentials.
              </p>
              <Link to="/login" className="inline-flex items-center gap-2 text-xs text-primary hover:underline pt-2">
                <ArrowLeft size={14} /> Back to Log In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetRequest} className="space-y-4">
              <Input
                label="Registered Email"
                type="email"
                placeholder="admin@theaitel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                leftIcon={<Mail size={16} />}
                className="bg-surface-3/50 border-white/10"
              />

              <div className="pt-2 flex flex-col gap-3">
                <Button type="submit" loading={loading} fullWidth size="md">
                  Send Reset Link
                </Button>
                <Link to="/login" className="inline-flex items-center justify-center gap-2 text-xs text-muted hover:text-white transition-colors duration-150">
                  <ArrowLeft size={14} /> Back to Log In
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
export default ForgotPasswordPage
