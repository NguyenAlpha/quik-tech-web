'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginUser } from '@/lib/api'
import { errorMessage } from '@/lib/api-error'
import { useLanguage } from '@/lib/language-context'
import { useRateLimitCooldown } from '@/hooks/use-rate-limit-cooldown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2, ShieldCheck } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const cooldown = useRateLimitCooldown()
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading || cooldown.isCoolingDown) return
    setError(null)
    setIsLoading(true)
    try {
      const { accessToken, user } = await loginUser({ usernameOrEmail, password })
      localStorage.setItem('admin_token', accessToken)
      localStorage.setItem('admin_user', JSON.stringify(user))
      document.cookie = `admin_token=${accessToken}; path=/admin; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      router.push('/admin/stats')
    } catch (err) {
      cooldown.record(err)
      setError(errorMessage(err, t))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-sm">
            <ShieldCheck className="size-7 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground tracking-tight">QuikTech POS Admin</h1>
            <p className="text-sm text-muted-foreground mt-0.5">System administration portal</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="usernameOrEmail" className="text-foreground text-sm">
                Username or Email
              </Label>
              <Input
                id="usernameOrEmail"
                type="text"
                placeholder="admin@quiktech.vn"
                value={usernameOrEmail}
                onChange={e => setUsernameOrEmail(e.target.value)}
                required
                autoComplete="username"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-foreground text-sm">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-2"
              disabled={isLoading || cooldown.isCoolingDown}
            >
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {cooldown.isCoolingDown ? t.common.retryIn.replace('{seconds}', String(cooldown.remainingSeconds)) : 'Sign in to Admin'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Restricted access — authorized personnel only
        </p>
      </div>
    </div>
  )
}
