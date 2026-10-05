'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/lib/api'

export function useRateLimitCooldown() {
  const [retryAt, setRetryAt] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  useEffect(() => {
    if (!retryAt) return
    const update = () => {
      const remaining = Math.max(0, Math.ceil((retryAt - Date.now()) / 1000))
      setRemainingSeconds(remaining)
      if (remaining === 0) setRetryAt(0)
    }
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [retryAt])

  const record = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.code === 'RATE_LIMIT_EXCEEDED' && error.retryAt) {
      const deadline = error.retryAt
      setRetryAt(previous => Math.max(previous, deadline))
      setRemainingSeconds(previous => Math.max(previous, error.retryAfterSeconds ?? 0))
    }
  }, [])

  return { remainingSeconds, isCoolingDown: remainingSeconds > 0, record }
}
