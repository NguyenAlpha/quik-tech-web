'use client'

import { Badge } from '@/components/ui/badge'
import { useAdminCopy } from '@/lib/admin-copy'

const plans: Record<string, { label: string; style: string }> = {
  FREE: { label: 'Free', style: 'bg-muted text-muted-foreground' },
  BASIC: { label: 'Basic', style: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  PRO: { label: 'Pro', style: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300' }
}

export function AdminPlanBadge({ plan }: { plan: string }) {
  return (
    <Badge variant="secondary" className={plans[plan]?.style}>
      {plans[plan]?.label ?? plan}
    </Badge>
  )
}

export function AdminSubscriptionStatus({ status }: { status: string }) {
  const copy = useAdminCopy()
  const statuses: Record<string, { label: string; style: string }> = {
    ACTIVE: { label: copy.active, style: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    EXPIRED: { label: copy.expired, style: 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
    CANCELLED: { label: copy.cancelled, style: 'bg-muted text-muted-foreground' }
  }
  return (
    <Badge variant="secondary" className={statuses[status]?.style}>
      {statuses[status]?.label ?? status}
    </Badge>
  )
}
