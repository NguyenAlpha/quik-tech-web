'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useLanguage } from '@/lib/language-context'
import { createDefaultBusiness } from '@/lib/api'
import { Store, Layers, Loader2 } from 'lucide-react'

export default function SetupPage() {
  const { storeId, isLoading, selectStore, updateMemberships } = useAuth()
  const { t } = useLanguage()
  const ta = t.auth
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && storeId) {
      router.replace('/dashboard')
    }
  }, [isLoading, storeId, router])

  const handleSingleStore = async () => {
    setIsCreating(true)
    setError(null)
    try {
      const result = await createDefaultBusiness()
      // Endpoint idempotent: store có thể null nếu business đã tồn tại mà chưa có store
      if (!result.store) {
        setError(ta.setupNoStoreError)
        setIsCreating(false)
        return
      }
      // Nạp membership từ response để Team/tên cửa hàng/switcher hiện ngay,
      // không phải đợi login lại (login lúc đăng ký trả memberships rỗng).
      updateMemberships([{
        businessId: result.business.id,
        businessName: result.business.name,
        stores: [{
          storeId: result.store.id,
          storeName: result.store.name,
          role: 'ROLE_OWNER',
          positionTitle: null,
        }],
      }])
      // Truyền businessId tường minh cho selectStore
      selectStore(result.store.id, result.business.id)
      router.replace('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsCreating(false)
    }
  }

  if (isLoading) return null

  return (
    <div className="w-full max-w-lg space-y-8">
      {/* Logo */}
      <div className="flex flex-col items-center gap-2 text-center">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="size-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold">Q</span>
          </div>
          <span className="font-semibold text-xl">QuikTech POS</span>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-4">{ta.setupTitle}</h1>
        <p className="text-muted-foreground text-sm">{ta.setupSubtitle}</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Single store */}
        <button
          onClick={handleSingleStore}
          disabled={isCreating}
          className="group relative flex flex-col items-center gap-4 rounded-xl border-2 border-primary bg-primary/5 p-8 text-center transition-colors hover:bg-primary/10 disabled:pointer-events-none disabled:opacity-60"
        >
          {isCreating ? (
            <Loader2 className="size-10 animate-spin text-primary" />
          ) : (
            <Store className="size-10 text-primary" />
          )}
          <div>
            <p className="font-semibold text-base">{ta.setupSingleStore}</p>
            <p className="text-sm text-muted-foreground mt-1">{ta.setupSingleDesc}</p>
          </div>
          <span className="absolute top-3 right-3 rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
            {ta.setupRecommended}
          </span>
        </button>

        {/* Multiple stores — coming soon */}
        <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-muted-foreground/30 p-8 text-center opacity-50">
          <Layers className="size-10 text-muted-foreground" />
          <div>
            <p className="font-semibold text-base">{ta.setupMultiStore}</p>
            <p className="text-sm text-muted-foreground mt-1">{ta.setupMultiDesc}</p>
          </div>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {ta.setupComingSoon}
          </span>
        </div>
      </div>

      {error && (
        <p className="text-center text-sm text-red-600">{error}</p>
      )}

      <p className="text-center text-xs text-muted-foreground">{ta.setupFooter}</p>
    </div>
  )
}
