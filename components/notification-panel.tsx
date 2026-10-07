'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, Check, Package, Receipt, Clock, Loader2, RefreshCw, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNotifications } from '@/lib/notification-context'
import { useNotificationCopy } from '@/lib/notification-copy'
import { useNotificationFeed } from '@/hooks/use-notification-feed'
import { useLanguage } from '@/lib/language-context'
import { errorMessage } from '@/lib/api-error'
import { notificationTarget, type AppNotification } from '@/lib/notifications'

export function NotificationPanel({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  const copy = useNotificationCopy()
  const { language, t } = useLanguage()
  const { summary, error: summaryError, loading: summaryLoading, busy, refresh, markRead, markAll } = useNotifications()
  const [filter, setFilter] = useState('all')
  const feed = useNotificationFeed(true, compact ? 8 : 20, filter === 'unread')
  const router = useRouter()
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const read = async (item: AppNotification, navigate = false) => {
    try {
      if (!item.read) await markRead(item.id)
      if (navigate && mounted.current) { onNavigate?.(); router.push(notificationTarget(item)) }
    } catch (err) { if (mounted.current) toast.error(errorMessage(err, t, copy.actionError)) }
  }
  const readAll = async () => {
    try { await markAll() } catch (err) { if (mounted.current) toast.error(errorMessage(err, t, copy.actionError)) }
  }

  return <section aria-label={copy.title} className="overflow-hidden rounded-xl border bg-card text-card-foreground">
    <div className="space-y-3 border-b p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2"><Bell className="size-4 text-primary" /><h2 className="font-semibold">{copy.title}</h2>{summary && !summaryError && <Badge variant="secondary">{summary.unreadCount} {copy.unread.toLowerCase()}</Badge>}</div>
        <Button type="button" variant="ghost" size="icon" aria-label={copy.refresh} disabled={feed.loading || summaryLoading || busy} onClick={() => { void refresh(); void feed.refresh() }}><RefreshCw className={`size-4 ${feed.loading || summaryLoading ? 'animate-spin' : ''}`} /></Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs value={filter} onValueChange={setFilter}><TabsList><TabsTrigger value="all">{copy.all}</TabsTrigger><TabsTrigger value="unread">{copy.unread}</TabsTrigger></TabsList></Tabs>
        <Button type="button" size="sm" variant="ghost" disabled={busy || !!summaryError || !summary?.unreadCount} onClick={readAll}><CheckCheck className="size-4" />{copy.markAll}</Button>
      </div>
    </div>

    <div className={compact ? 'max-h-[55dvh] overflow-y-auto overscroll-contain' : ''}>
      {!!summaryError && <div role="alert" className="m-4 space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"><p>{errorMessage(summaryError, t, copy.loadError)}</p><Button type="button" variant="outline" size="sm" disabled={summaryLoading} onClick={() => void refresh()}>{copy.retry}</Button></div>}
      {summary && !summaryError && (summary.lowStockCount > 0 || summary.pendingInvoiceCount > 0) && <div className="space-y-2 border-b bg-muted/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copy.alerts}</p>
        {summary.lowStockCount > 0 && <Link href="/inventory" onClick={onNavigate} className="flex items-center gap-2 rounded-lg border bg-background p-3 text-sm hover:bg-accent"><Package className="size-4 shrink-0 text-amber-600" /><span className="flex-1">{copy.stock}</span><Badge variant="secondary">{summary.lowStockCount}</Badge><ArrowUpRight className="size-4" /></Link>}
        {summary.pendingInvoiceCount > 0 && <Link href="/subscription" onClick={onNavigate} className="flex items-center gap-2 rounded-lg border bg-background p-3 text-sm hover:bg-accent"><Receipt className="size-4 shrink-0 text-primary" /><span className="flex-1">{copy.pending}</span><Badge variant="secondary">{summary.pendingInvoiceCount}</Badge><ArrowUpRight className="size-4" /></Link>}
        <p className="text-xs text-muted-foreground">{copy.alertHint}</p>
      </div>}

      {!!feed.error && <div role="alert" className="m-4 space-y-2 rounded-lg border border-destructive/30 p-3 text-sm"><p>{errorMessage(feed.error, t, copy.loadError)}</p><Button type="button" variant="outline" size="sm" disabled={feed.loading} onClick={() => void feed.refresh()}>{copy.retry}</Button></div>}
      {feed.loading && !feed.items.length ? <div role="status" className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />{copy.loading}</div> : !feed.error && !feed.items.length ?
        <div className="space-y-2 px-5 py-10 text-center"><Bell className="mx-auto mb-3 size-8 text-muted-foreground/50" /><p className="text-sm font-medium">{filter === 'unread' ? copy.caughtUp : copy.empty}</p><p className="text-xs text-muted-foreground">{filter === 'unread' ? copy.caughtUpHint : copy.emptyHint}</p></div> : null}

      <ul className="divide-y">{feed.items.map(item => {
        const Icon = item.type === 'LOW_STOCK' ? Package : item.type.startsWith('INVOICE') ? Receipt : Clock
        const detail = item.type.startsWith('SUBSCRIPTION') && item.detail ? new Date(item.detail).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') : item.detail
        return <li key={item.id} className={`flex gap-2 p-3 sm:p-4 ${item.read ? '' : 'bg-primary/5'}`}>
          <button type="button" disabled={busy} onClick={() => void read(item, true)} className="flex min-w-0 flex-1 gap-3 rounded-md text-left outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60">
            <span className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg ${item.type === 'LOW_STOCK' ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary'}`}><Icon className="size-4" /></span>
            <span className="min-w-0 space-y-1">
              <span className="block text-sm font-medium">{copy.types[item.type] ?? copy.title}{!item.read && <span className="ml-2 inline-block size-2 rounded-full bg-primary" aria-label={copy.unread} />}</span>
              <span className="block break-words text-sm">{item.subject}</span>
              {detail && <span className="block break-words text-xs text-muted-foreground">{detail}</span>}
              <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}</time>{item.resolved && <Badge variant="outline" className="text-[10px]">{copy.resolved}</Badge>}</span>
              <span className="sr-only">{copy.open}</span>
            </span>
          </button>
          {!item.read && <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" aria-label={copy.markRead} title={copy.markRead} disabled={busy} onClick={() => void read(item)}><Check className="size-4" /></Button>}
        </li>
      })}</ul>
      {!compact && feed.cursor && <div className="p-4 text-center"><Button type="button" variant="outline" disabled={feed.loading || busy} onClick={() => void feed.loadMore()}>{feed.loading && <Loader2 className="size-4 animate-spin" />}{copy.more}</Button></div>}
    </div>
    <div className="border-t p-3">{compact ? <Button asChild variant="ghost" className="w-full"><Link href="/notifications" onClick={onNavigate}>{copy.viewAll}<ArrowUpRight className="size-4" /></Link></Button> : <p className="text-xs text-muted-foreground">{copy.historyHint}</p>}</div>
  </section>
}
