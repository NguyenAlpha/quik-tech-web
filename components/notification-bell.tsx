'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { NotificationPanel } from '@/components/notification-panel'
import { useNotifications } from '@/lib/notification-context'
import { useNotificationCopy } from '@/lib/notification-copy'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { summary, error, refresh } = useNotifications()
  const copy = useNotificationCopy()
  const count = error ? 0 : summary?.unreadCount ?? 0

  return <Popover open={open} onOpenChange={value => { setOpen(value); if (value) void refresh() }}>
    <PopoverTrigger asChild><Button variant="ghost" size="icon" className="relative size-9" aria-label={`${copy.title}${count ? ` (${count} ${copy.unread.toLowerCase()})` : ''}`}>
      <Bell className="size-4" />
      {count > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">{count > 99 ? '99+' : count}</span>}
      {!!error && <span className="absolute right-0 top-0 size-2 rounded-full bg-amber-500" aria-label={copy.loadError} />}
    </Button></PopoverTrigger>
    <PopoverContent align="end" className="w-[min(26rem,calc(100vw-1.5rem))] border-0 p-0 shadow-lg">{open && <NotificationPanel compact onNavigate={() => setOpen(false)} />}</PopoverContent>
  </Popover>
}
