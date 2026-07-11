'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useLanguage } from '@/lib/language-context'
import { registerUser } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const { login } = useAuth()
  const { t } = useLanguage()
  const ta = t.auth
  const router = useRouter()
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirmPassword) {
      setError(ta.passwordMismatch)
      return
    }
    if (form.password.length < 6) {
      setError(ta.passwordTooShort)
      return
    }
    // Backend giới hạn 72 ký tự (BCrypt) và username không cho ký tự đặc biệt/@
    if (form.password.length > 72) {
      setError(ta.passwordTooLong)
      return
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(form.username)) {
      setError(ta.usernameInvalid)
      return
    }

    setIsLoading(true)
    try {
      const { accessToken, user, memberships, refreshToken } = await registerUser({
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        password: form.password,
      })
      login(accessToken, user, memberships, refreshToken)
      router.push(memberships.length === 0 ? '/setup' : '/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">Q</span>
            </div>
            <span className="font-semibold text-lg">QuikTech</span>
          </div>
        </div>
        <CardTitle className="text-xl">{ta.registerTitle}</CardTitle>
        <CardDescription>{ta.registerSubtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName">{ta.fullNameLabel}</Label>
            <Input
              id="fullName"
              placeholder={ta.fullNamePlaceholder}
              value={form.fullName}
              onChange={set('fullName')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">{ta.usernameLabel}</Label>
            <Input
              id="username"
              placeholder={ta.usernamePlaceholder}
              value={form.username}
              onChange={set('username')}
              required
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{ta.emailLabel}</Label>
            <Input
              id="email"
              type="email"
              placeholder={ta.emailPlaceholder}
              value={form.email}
              onChange={set('email')}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{ta.passwordLabel}</Label>
            <Input
              id="password"
              type="password"
              placeholder={ta.passwordPlaceholder}
              value={form.password}
              onChange={set('password')}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{ta.confirmPasswordLabel}</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder={ta.passwordPlaceholder}
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              required
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {ta.registerButton}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {ta.hasAccount}{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {ta.loginLink}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
