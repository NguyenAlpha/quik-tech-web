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
import { adminGetBusinesses, adminGetSubscription, adminChangePlan } from '@/lib/api'
import type { Business, BusinessSubscription } from '@/lib/types'

const planStyles: Record<string, { label: string; className: string }> = {
  FREE:  { label: 'Free',  className: 'bg-slate-700 text-slate-300' },
  BASIC: { label: 'Basic', className: 'bg-blue-900/60 text-blue-300' },
  PRO:   { label: 'Pro',   className: 'bg-amber-900/60 text-amber-300' },
}

const statusColor: Record<string, string> = {
  ACTIVE:    'text-emerald-400',
  EXPIRED:   'text-red-400',
  CANCELLED: 'text-slate-500',
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
      .catch(() => toast.error(ts.businessesLoadError))
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
      toast.error(err instanceof Error ? err.message : ts.changePlanError)
    } finally {
      setIsChangingPlan(false)
    }
  }

  const filtered = search.trim()
    ? businesses.filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
    : businesses

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">{ts.businessesTitle}</h1>
        <p className="text-sm text-slate-400 mt-1">{ts.businessesSubtitle}</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <Input
          className="pl-9 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
          placeholder={ts.businessesSearch}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="pl-5 text-slate-400">{ts.businessesColName}</TableHead>
              <TableHead className="text-slate-400">{ts.businessesColPlan}</TableHead>
              <TableHead className="text-slate-400">{ts.businessesColStatus}</TableHead>
              <TableHead className="text-slate-400">{ts.businessesColExpiry}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin text-slate-500" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-sm text-slate-500">
                  {ts.businessesNoData}
                </TableCell>
              </TableRow>
            ) : filtered.map(b => (
              <TableRow
                key={b.id}
                className="border-slate-800 hover:bg-slate-800/60 cursor-pointer"
                onClick={() => openDetail(b)}
              >
                <TableCell className="pl-5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-slate-800">
                      <Building2 className="size-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{b.name}</p>
                      <p className="text-xs text-slate-500">#{b.id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {b.sub ? (
                    <Badge variant="secondary" className={planStyles[b.sub.plan]?.className}>
                      {planStyles[b.sub.plan]?.label ?? b.sub.plan}
                    </Badge>
                  ) : <span className="text-xs text-slate-600">—</span>}
                </TableCell>
                <TableCell>
                  {b.sub ? (
                    <span className={`text-sm font-medium ${statusColor[b.sub.status] ?? 'text-slate-400'}`}>
                      {b.sub.status}
                    </span>
                  ) : <span className="text-xs text-slate-600">—</span>}
                </TableCell>
                <TableCell className="text-sm text-slate-400">
                  {b.sub?.expiresAt ? new Date(b.sub.expiresAt).toLocaleDateString() : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="size-4 text-slate-400" />
              {selected?.name}
            </DialogTitle>
          </DialogHeader>

          {isSubLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-slate-400" />
            </div>
          ) : selected?.sub ? (
            <div className="space-y-4">
              {/* Subscription info */}
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500 mb-1">{ts.currentPlanLabel}</p>
                  <Badge variant="secondary" className={planStyles[selected.sub.plan]?.className}>
                    {planStyles[selected.sub.plan]?.label ?? selected.sub.plan}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">{ts.currentStatusLabel}</p>
                  <p className={`font-medium ${statusColor[selected.sub.status] ?? ''}`}>
                    {selected.sub.status}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">{ts.expiresLabel}</p>
                  <p className="text-slate-300">
                    {selected.sub.expiresAt ? new Date(selected.sub.expiresAt).toLocaleDateString() : ts.never}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Billing cycle</p>
                  <p className="text-slate-300">{selected.sub.billingCycle ?? '—'}</p>
                </div>
              </div>

              <Separator className="bg-slate-800" />

              {/* Override */}
              <div className="flex items-start gap-2 rounded-lg border border-amber-800/50 bg-amber-950/20 p-3">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <p className="text-xs text-amber-400">{ts.overrideWarning}</p>
              </div>

              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-slate-300 text-sm">{ts.newPlanLabel}</Label>
                  <Select value={newPlan} onValueChange={setNewPlan}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="FREE" className="text-slate-200">Free</SelectItem>
                      <SelectItem value="BASIC" className="text-slate-200">Basic</SelectItem>
                      <SelectItem value="PRO" className="text-slate-200">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newPlan !== 'FREE' && (
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-slate-300 text-sm">{ts.colCycle}</Label>
                    <Select value={newCycle} onValueChange={setNewCycle}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="MONTHLY" className="text-slate-200">{ts.monthly}</SelectItem>
                        <SelectItem value="YEARLY" className="text-slate-200">{ts.yearly}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button
                  onClick={handleChangePlan}
                  disabled={!newPlan || isChangingPlan}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isChangingPlan && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {isChangingPlan ? ts.changingPlan : ts.changePlan}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-4 text-center">{ts.noBusinessSelected}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
