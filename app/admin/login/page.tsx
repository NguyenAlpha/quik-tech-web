'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginUser } from '@/lib/api'
import { errorMessage } from '@/lib/api-error'
import { useLanguage } from '@/lib/language-context'
import { useAdminCopy } from '@/lib/admin-copy'
import { useRateLimitCooldown } from '@/hooks/use-rate-limit-cooldown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemeToggle } from '@/components/theme-toggle'
import { AlertCircle, ArrowRight, Building2, CreditCard, Eye, EyeOff, Loader2, ShieldCheck, Users } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const copy = useAdminCopy()
  const cooldown = useRateLimitCooldown()
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isLoading || cooldown.isCoolingDown) return
    setError(null)
    setIsLoading(true)
    try {
      const { accessToken, user } = await loginUser({ usernameOrEmail, password })
      localStorage.setItem('admin_token', accessToken)
      localStorage.setItem('admin_user', JSON.stringify(user))
      document.cookie = `admin_token=${accessToken}; path=/admin; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      router.replace('/admin/stats')
    } catch (err) {
      cooldown.record(err)
      setError(errorMessage(err, t))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-2">
      {/* Logo */}
      <aside className="hidden flex-col justify-between border-r bg-primary/5 p-10 lg:flex xl:p-16">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="font-semibold tracking-tight">QuikTech POS</p>
            <p className="text-xs text-muted-foreground">{copy.workspace}</p>
          </div>
        </div>
        <div className="max-w-md space-y-8 py-16">
          <div className="space-y-5">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">{copy.loginWelcome}</h1>
            <p className="text-base leading-relaxed text-muted-foreground">{copy.loginIntro}</p>
          </div>
          <div className="space-y-3">
            {[
              { icon: Building2, label: copy.businesses },
              { icon: Users, label: copy.users },
              { icon: CreditCard, label: copy.subscriptions }
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl border bg-card/80 px-4 py-3 text-sm">
                <item.icon className="size-4 text-primary" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4" />
          {copy.restrictedAccess}
        </p>
      </aside>

      <div className="flex min-w-0 flex-col">
        <div className="flex items-center justify-end gap-2 px-4 py-4 sm:px-8">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
        <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
          <div className="w-full max-w-sm space-y-6">
            <div className="flex items-center gap-3 lg:hidden">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="font-semibold">QuikTech POS</p>
                <p className="text-xs text-muted-foreground">{copy.workspace}</p>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">{copy.loginTitle}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{copy.loginDescription}</p>
            </div>

            {/* Card */}
            <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="usernameOrEmail">{copy.usernameOrEmail}</Label>
                  <Input
                    id="usernameOrEmail"
                    type="text"
                    placeholder="admin@quiktech.vn"
                    value={usernameOrEmail}
                    onChange={(event) => setUsernameOrEmail(event.target.value)}
                    required
                    autoComplete="username"
                    disabled={isLoading}
                    className="h-10 bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t.auth.passwordLabel}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t.auth.passwordPlaceholder}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      autoComplete="current-password"
                      disabled={isLoading}
                      className="h-10 bg-background pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 size-8 text-muted-foreground"
                      aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="h-10 w-full gap-2" disabled={isLoading || cooldown.isCoolingDown}>
                  {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                  {cooldown.isCoolingDown
                    ? t.common.retryIn.replace('{seconds}', String(cooldown.remainingSeconds))
                    : copy.signIn}
                  {!isLoading && !cooldown.isCoolingDown && <ArrowRight className="size-4" />}
                </Button>
              </form>
            </div>
            <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 shrink-0" />
              {copy.restrictedAccess}
            </p>
          </div>
        </main>
        <p className="px-4 pb-6 text-center text-xs text-muted-foreground">QuikTech POS</p>
      </div>
    </div>
  )
}
