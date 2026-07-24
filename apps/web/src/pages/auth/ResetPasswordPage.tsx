import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'
import { Lock, Check, ArrowRight } from 'lucide-react'

export function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    const token = searchParams.get('token')
    if (!token) {
      toast.error('Missing verification token. Check link details.')
      return
    }

    setLoading(true)

    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        // better-auth handles token resolution automatically when token is present
      })

      if (error) {
        toast.error(error.message || 'Failed to update credentials.')
      } else {
        toast.success('Password updated successfully!')
        setSuccess(true)
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
          <div className="w-12 h-12 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center text-success mx-auto mb-4">
            <Lock size={24} />
          </div>
          <CardTitle className="font-display font-bold text-2xl text-white">Create New Password</CardTitle>
          <CardDescription className="text-xs text-muted mt-1">
            Choose a strong password containing numbers and letters
          </CardDescription>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted">
                Your credentials have been successfully updated. You can now use your new password to sign into your account.
              </p>
              <Button onClick={() => navigate('/login')} fullWidth size="md" rightIcon={<ArrowRight size={14} />}>
                Proceed to Log In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                leftIcon={<Lock size={16} />}
                className="bg-surface-3/50 border-white/10"
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                leftIcon={<Lock size={16} />}
                className="bg-surface-3/50 border-white/10"
              />

              <div className="pt-2">
                <Button type="submit" loading={loading} fullWidth size="md">
                  Update Password
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
export default ResetPasswordPage
