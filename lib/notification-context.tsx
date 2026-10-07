'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { ApiError } from '@/lib/api'
import { fetchNotificationSummary, readNotification, readAllNotifications, type NotificationSummary } from '@/lib/notifications'

interface NotificationContextValue {
  storeId: number
  summary: NotificationSummary | null
  error: unknown
  loading: boolean
  busy: boolean
  revision: number
  refresh: () => Promise<void>
  markRead: (id: number) => Promise<void>
  markAll: () => Promise<void>
}
const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ storeId, children }: { storeId: number; children: ReactNode }) {
  const [summary, setSummary] = useState<NotificationSummary | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [revision, setRevision] = useState(0)
  const request = useRef<AbortController | null>(null)
  const mounted = useRef(true)
  const blockedUntil = useRef(0)
  const mutating = useRef(false)

  const refresh = useCallback(async () => {
    if (request.current || Date.now() < blockedUntil.current) return
    const controller = new AbortController()
    request.current = controller
    setLoading(true)
    try {
      const data = await fetchNotificationSummary(storeId, controller.signal)
      if (!controller.signal.aborted) { setSummary(data); setError(null) }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err)
        if (err instanceof ApiError && err.status === 429) blockedUntil.current = err.retryAt ?? Date.now() + 60_000
      }
    } finally {
      if (request.current === controller) request.current = null
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    mounted.current = true
    void refresh()
    const visibleRefresh = () => { if (document.visibilityState === 'visible') void refresh() }
    const timer = setInterval(visibleRefresh, 60_000)
    window.addEventListener('focus', visibleRefresh)
    document.addEventListener('visibilitychange', visibleRefresh)
    return () => {
      mounted.current = false
      request.current?.abort()
      request.current = null
      clearInterval(timer)
      window.removeEventListener('focus', visibleRefresh)
      document.removeEventListener('visibilitychange', visibleRefresh)
    }
  }, [refresh])

  const mutate = async (operation: () => Promise<void>) => {
    if (mutating.current) return
    mutating.current = true
    setBusy(true)
    try {
      await operation()
      if (!mounted.current) return
      request.current?.abort()
      request.current = null
      setRevision(value => value + 1)
      await refresh()
    } finally {
      mutating.current = false
      if (mounted.current) setBusy(false)
    }
  }

  return <NotificationContext.Provider value={{ storeId, summary, error, loading, busy, revision, refresh,
    markRead: id => mutate(() => readNotification(storeId, id)),
    markAll: () => mutate(() => readAllNotifications(storeId, summary?.latestId ?? 0)),
  }}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const value = useContext(NotificationContext)
  if (!value) throw new Error('NotificationProvider is missing')
  return value
}
