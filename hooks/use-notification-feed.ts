'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNotifications } from '@/lib/notification-context'
import { fetchNotifications, type AppNotification } from '@/lib/notifications'

export function useNotificationFeed(enabled: boolean, size: number, unreadOnly: boolean) {
  const { storeId, revision } = useNotifications()
  const [items, setItems] = useState<AppNotification[]>([])
  const [cursor, setCursor] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const request = useRef<AbortController | null>(null)

  const load = useCallback(async (next?: number | null) => {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setLoading(true)
    setError(null)
    try {
      const result = await fetchNotifications(storeId, size, unreadOnly, next, controller.signal)
      if (!controller.signal.aborted) {
        setItems(previous => next ? [...previous, ...result.content.filter(item => !previous.some(old => old.id === item.id))] : result.content)
        setCursor(result.nextCursor)
      }
    } catch (err) {
      if (!controller.signal.aborted) setError(err)
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [storeId, size, unreadOnly])

  useEffect(() => {
    if (enabled) { setItems([]); setCursor(null); void load() }
    return () => { request.current?.abort() }
  }, [enabled, load, revision])

  return { items, loading, error, cursor, refresh: () => load(), loadMore: () => load(cursor) }
}
