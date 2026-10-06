'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Search, Building2, AlertTriangle, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useLanguage } from '@/lib/language-context'
import { errorMessage } from '@/lib/api-error'
import { adminGetBusinesses, adminGetSubscription, adminChangePlan } from '@/lib/api'
import type { Business, BusinessSubscription } from '@/lib/types'

const planStyles: Record<string, { label: string; className: string }> = {
  FREE:  { label: 'Free',  className: 'bg-muted text-foreground' },
  BASIC: { label: 'Basic', className: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' },
  PRO:   { label: 'Pro',   className: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' },
}

const statusColor: Record<string, string> = {
  ACTIVE:    'text-emerald-700 dark:text-emerald-400',
  EXPIRED:   'text-destructive',
  CANCELLED: 'text-muted-foreground',
}

interface BusinessWithSub extends Business {
  sub?: BusinessSubscription
}

export default function AdminBusinessesPage() {
  const { t } = useLanguage()
  const ts = t.subscription

  const [businesses, setBusinesses] = useState<BusinessWithSub[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<BusinessWithSub | null>(null)
  const [isSubLoading, setIsSubLoading] = useState(false)
  const [newPlan, setNewPlan] = useState('')
  const [newCycle, setNewCycle] = useState('MONTHLY')
  const [isChangingPlan, setIsChangingPlan] = useState(false)

  useEffect(() => {
    adminGetBusinesses()
      .then(async list => {
        setBusinesses(list.map(b => ({ ...b })))
        const results = await Promise.allSettled(list.map(b => adminGetSubscription(b.id)))
        setBusinesses(list.map((b, i) => {
          const r = results[i]
          return r.status === 'fulfilled' ? { ...b, sub: r.value } : { ...b }
        }))
      })
      .catch(err => toast.error(errorMessage(err, t, ts.businessesLoadError)))
      .finally(() => setIsLoading(false))
  }, [])

  const openDetail = async (b: BusinessWithSub) => {
    setSelected(b)
    if (!b.sub) {
      setIsSubLoading(true)
      try {
        const sub = await adminGetSubscription(b.id)
        const updated = { ...b, sub }
        setBusinesses(prev => prev.map(x => x.id === b.id ? updated : x))
        setSelected(updated)
        setNewPlan(sub.plan)
        setNewCycle(sub.billingCycle ?? 'MONTHLY')
      } catch {
        setNewPlan('')
      } finally {
        setIsSubLoading(false)
      }
    } else {
      setNewPlan(b.sub.plan)
      setNewCycle(b.sub.billingCycle ?? 'MONTHLY')
    }
  }

  const handleChangePlan = async () => {
    if (!selected || !newPlan) return
    setIsChangingPlan(true)
    try {
      // billingCycle chỉ gửi với gói trả phí — backend từ chối khi thiếu (400)
      const updated = await adminChangePlan(selected.id, newPlan, newPlan === 'FREE' ? undefined : newCycle)
      const updatedBusiness = { ...selected, sub: updated }
      setBusinesses(prev => prev.map(x => x.id === selected.id ? updatedBusiness : x))
      setSelected(updatedBusiness)
      toast.success(ts.changePlanSuccess)
    } catch (err) {
      toast.error(errorMessage(err, t, ts.changePlanError))
    } finally {
      setIsChangingPlan(false)
    }
  }

  const filtered = search.trim()
    ? businesses.filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
    : businesses

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{ts.businessesTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">{ts.businessesSubtitle}</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground"
          placeholder={ts.businessesSearch}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="pl-5 text-muted-foreground">{ts.businessesColName}</TableHead>
              <TableHead className="text-muted-foreground">{ts.businessesColPlan}</TableHead>
              <TableHead className="text-muted-foreground">{ts.businessesColStatus}</TableHead>
              <TableHead className="text-muted-foreground">{ts.businessesColExpiry}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                  {ts.businessesNoData}
                </TableCell>
              </TableRow>
            ) : filtered.map(b => (
              <TableRow
                key={b.id}
                className="border-border hover:bg-muted/60 cursor-pointer"
                onClick={() => openDetail(b)}
              >
                <TableCell className="pl-5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                      <Building2 className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{b.name}</p>
                      <p className="text-xs text-muted-foreground">#{b.id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {b.sub ? (
                    <Badge variant="secondary" className={planStyles[b.sub.plan]?.className}>
                      {planStyles[b.sub.plan]?.label ?? b.sub.plan}
                    </Badge>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  {b.sub ? (
                    <span className={`text-sm font-medium ${statusColor[b.sub.status] ?? 'text-muted-foreground'}`}>
                      {b.sub.status}
                    </span>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {b.sub?.expiresAt ? new Date(b.sub.expiresAt).toLocaleDateString() : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground" />
              {selected?.name}
            </DialogTitle>
          </DialogHeader>

          {isSubLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : selected?.sub ? (
            <div className="space-y-4">
              {/* Subscription info */}
              <div className="rounded-lg border border-border bg-muted/50 p-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{ts.currentPlanLabel}</p>
                  <Badge variant="secondary" className={planStyles[selected.sub.plan]?.className}>
                    {planStyles[selected.sub.plan]?.label ?? selected.sub.plan}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{ts.currentStatusLabel}</p>
                  <p className={`font-medium ${statusColor[selected.sub.status] ?? ''}`}>
                    {selected.sub.status}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{ts.expiresLabel}</p>
                  <p className="text-foreground">
                    {selected.sub.expiresAt ? new Date(selected.sub.expiresAt).toLocaleDateString() : ts.never}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Billing cycle</p>
                  <p className="text-foreground">{selected.sub.billingCycle ?? '—'}</p>
                </div>
              </div>

              <Separator className="bg-muted" />

              {/* Override */}
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-3">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <p className="text-xs text-amber-800 dark:text-amber-400">{ts.overrideWarning}</p>
              </div>

              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-foreground text-sm">{ts.newPlanLabel}</Label>
                  <Select value={newPlan} onValueChange={setNewPlan}>
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-muted border-border">
                      <SelectItem value="FREE" className="text-foreground">Free</SelectItem>
                      <SelectItem value="BASIC" className="text-foreground">Basic</SelectItem>
                      <SelectItem value="PRO" className="text-foreground">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newPlan !== 'FREE' && (
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-foreground text-sm">{ts.colCycle}</Label>
                    <Select value={newCycle} onValueChange={setNewCycle}>
                      <SelectTrigger className="bg-muted border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-muted border-border">
                        <SelectItem value="MONTHLY" className="text-foreground">{ts.monthly}</SelectItem>
                        <SelectItem value="YEARLY" className="text-foreground">{ts.yearly}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button
                  onClick={handleChangePlan}
                  disabled={!newPlan || isChangingPlan}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isChangingPlan && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {isChangingPlan ? ts.changingPlan : ts.changePlan}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">{ts.noBusinessSelected}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
