'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'
import { adminRequest } from '@/lib/admin-client'

const PendingContext = createContext<{
  count: number | null
  refresh: () => void
}>({ count: null, refresh: () => {} })

export function AdminPendingProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [count, setCount] = useState<number | null>(null)
  const version = useRef(0)
  const refresh = useCallback(() => {
    const request = ++version.current
    adminRequest<number>('/api/admin/subscriptions/invoices/pending/count')
      .then((value) => {
        if (request === version.current) setCount(value)
      })
      .catch(() => {
        if (request === version.current) setCount(null)
      })
  }, [])
  useEffect(() => {
    refresh()
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      version.current++
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])
  return (
    <PendingContext.Provider value={{ count, refresh }}>
      {children}
    </PendingContext.Provider>
  )
}

export const useAdminPending = () => useContext(PendingContext)
