'use client'

import { PageHeader } from '@/components/page-header'
import { NotificationPanel } from '@/components/notification-panel'
import { useNotificationCopy } from '@/lib/notification-copy'

export default function NotificationsPage() {
  const copy = useNotificationCopy()
  return <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
    <PageHeader title={copy.title} subtitle={copy.description} />
    <NotificationPanel />
  </div>
}
