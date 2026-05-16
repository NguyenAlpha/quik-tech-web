'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthUser, StoreMembership } from './types'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  storeId: number | null
  memberships: StoreMembership[]
  isLoading: boolean
  login: (token: string, user: AuthUser, memberships: StoreMembership[]) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [storeId, setStoreId] = useState<number | null>(null)
  const [memberships, setMemberships] = useState<StoreMembership[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('auth_user')
    const storedStoreId = localStorage.getItem('auth_store_id')
    const storedMemberships = localStorage.getItem('auth_memberships')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      if (storedStoreId) setStoreId(parseInt(storedStoreId))
      if (storedMemberships) setMemberships(JSON.parse(storedMemberships))
    }
    setIsLoading(false)
  }, [])

  const login = (token: string, user: AuthUser, memberships: StoreMembership[]) => {
    const firstStoreId = memberships[0]?.storeId ?? null

    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(user))
    localStorage.setItem('auth_memberships', JSON.stringify(memberships))
    if (firstStoreId) localStorage.setItem('auth_store_id', String(firstStoreId))

    document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`

    setToken(token)
    setUser(user)
    setMemberships(memberships)
    setStoreId(firstStoreId)
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_store_id')
    localStorage.removeItem('auth_memberships')
    document.cookie = 'auth_token=; path=/; max-age=0'
    setToken(null)
    setUser(null)
    setStoreId(null)
    setMemberships([])
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, token, storeId, memberships, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
