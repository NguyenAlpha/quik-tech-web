'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export function useAdminUrl() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const update = useCallback(
    (values: Record<string, string | number | null>) => {
      const next = new URLSearchParams(params.toString())
      for (const [key, value] of Object.entries(values)) {
        if (value === null || value === '') next.delete(key)
        else next.set(key, String(value))
      }
      const query = next.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false
      })
    },
    [params, pathname, router]
  )
  const rawPage = Number(params.get('page') ?? 0)
  const page = Number.isSafeInteger(rawPage) && rawPage >= 0 ? rawPage : 0
  return { params, update, page }
}
