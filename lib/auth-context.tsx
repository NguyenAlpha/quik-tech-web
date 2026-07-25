'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthUser, BusinessMembership } from './types'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  businessId: number | null
  storeId: number | null
  memberships: BusinessMembership[]
  isLoading: boolean
  login: (token: string, user: AuthUser, memberships: BusinessMembership[], refreshToken?: string) => void
  logout: () => void
  selectStore: (storeId: number, businessId?: number) => void
  updateMemberships: (memberships: BusinessMembership[]) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [businessId, setBusinessId] = useState<number | null>(null)
  const [storeId, setStoreId] = useState<number | null>(null)
  const [memberships, setMemberships] = useState<BusinessMembership[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('auth_user')
    const storedBusinessId = localStorage.getItem('auth_business_id')
    const storedStoreId = localStorage.getItem('auth_store_id')
    const storedMemberships = localStorage.getItem('auth_memberships')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      if (storedBusinessId) setBusinessId(parseInt(storedBusinessId))
      if (storedStoreId) setStoreId(parseInt(storedStoreId))
      if (storedMemberships) setMemberships(JSON.parse(storedMemberships))
    }
    setIsLoading(false)
  }, [])

  const login = (token: string, user: AuthUser, memberships: BusinessMembership[], refreshToken?: string) => {
    const firstBusiness = memberships[0] ?? null
    const firstBusinessId = firstBusiness?.businessId ?? null
    const firstStoreId = firstBusiness?.stores[0]?.storeId ?? null

    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(user))
    localStorage.setItem('auth_memberships', JSON.stringify(memberships))
    if (firstBusinessId) localStorage.setItem('auth_business_id', String(firstBusinessId))
    if (firstStoreId) localStorage.setItem('auth_store_id', String(firstStoreId))
    if (refreshToken) localStorage.setItem('auth_refresh_token', refreshToken)

    document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`

    setToken(token)
    setUser(user)
    setMemberships(memberships)
    setBusinessId(firstBusinessId)
    setStoreId(firstStoreId)
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_business_id')
    localStorage.removeItem('auth_store_id')
    localStorage.removeItem('auth_memberships')
    localStorage.removeItem('auth_refresh_token')
    document.cookie = 'auth_token=; path=/; max-age=0'
    setToken(null)
    setUser(null)
    setBusinessId(null)
    setStoreId(null)
    setMemberships([])
    router.push('/login')
  }

  // Khi đổi store cũng cập nhật business tương ứng.
  // explicitBusinessId: dùng khi business chưa có trong memberships
  // (ví dụ vừa tạo qua /api/businesses/default ở trang setup)
  const selectStore = (id: number, explicitBusinessId?: number) => {
    const resolvedBusinessId = explicitBusinessId
      ?? memberships.find(b => b.stores.some(s => s.storeId === id))?.businessId
    if (resolvedBusinessId) {
      localStorage.setItem('auth_business_id', String(resolvedBusinessId))
      setBusinessId(resolvedBusinessId)
    }
    localStorage.setItem('auth_store_id', String(id))
    setStoreId(id)
  }

  // Nạp/ghi đè danh sách membership (dùng khi vừa tạo business ở setup — response
  // trả về business/store nhưng login trước đó có memberships rỗng nên UI thiếu Team/tên store)
  const updateMemberships = (m: BusinessMembership[]) => {
    localStorage.setItem('auth_memberships', JSON.stringify(m))
    setMemberships(m)
  }

  return (
    <AuthContext.Provider value={{ user, token, businessId, storeId, memberships, isLoading, login, logout, selectStore, updateMemberships }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
