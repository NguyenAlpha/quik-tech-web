'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Layers, Loader2, Pencil, RefreshCw, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AdminReasonField } from '@/components/admin-reason-field'
import { useLanguage } from '@/lib/language-context'
import { useAdminCopy } from '@/lib/admin-copy'
import { usePlanCopy } from '@/lib/plan-copy'
import { ApiError } from '@/lib/api'
import { errorMessage } from '@/lib/api-error'
import { formatCurrency } from '@/lib/utils'
import { getAdminPlans, updateAdminPlan, type AdminPlan } from '@/lib/plans'

const LIMIT_KEYS = ['maxStores', 'maxStaff', 'maxProducts', 'maxWarehouses'] as const
type LimitKey = typeof LIMIT_KEYS[number]

// Giới hạn trong form: chuỗi để giữ ô trống khi đang gõ; unlimited = gửi null
interface PlanForm {
  monthlyPrice: string
  yearlyPrice: string
  limits: Record<LimitKey, { value: string; unlimited: boolean }>
  reason: string
}

const toForm = (plan: AdminPlan): PlanForm => ({
  monthlyPrice: String(plan.monthlyPrice),
  yearlyPrice: String(plan.yearlyPrice),
  limits: Object.fromEntries(LIMIT_KEYS.map(key => [key, {
    value: plan[key] === null ? '' : String(plan[key]),
    unlimited: plan[key] === null,
  }])) as PlanForm['limits'],
  reason: '',
})

export default function AdminPlansPage() {
  const { t } = useLanguage()
  const copy = usePlanCopy()
  const admin = useAdminCopy()
  const ts = t.subscription
  const planNames: Record<AdminPlan['code'], string> = { FREE: ts.planFree, BASIC: ts.planBasic, PRO: ts.planPro }

  const [plans, setPlans] = useState<AdminPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<AdminPlan | null>(null)
  const [form, setForm] = useState<PlanForm | null>(null)
  const [saving, setSaving] = useState(false)
  const requestId = useRef(0)

  const load = useCallback(async () => {
    const request = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const result = await getAdminPlans()
      if (request === requestId.current) setPlans(result)
    } catch (err) {
      if (request === requestId.current) setError(errorMessage(err, t))
    } finally {
      if (request === requestId.current) setLoading(false)
    }
  }, [t])
  useEffect(() => { void load(); return () => { requestId.current++ } }, [load])

  const openEditor = (plan: AdminPlan) => {
    setForm(toForm(plan))
    setEditing(plan)
  }

  const limitValue = (key: LimitKey) => {
    const limit = form!.limits[key]
    return limit.unlimited ? null : Number(limit.value)
  }
  const isFree = editing?.code === 'FREE'
  const formValid = !!form
    && form.monthlyPrice.trim() !== '' && Number(form.monthlyPrice) >= 0
    && form.yearlyPrice.trim() !== '' && Number(form.yearlyPrice) >= 0
    && LIMIT_KEYS.every(key => form.limits[key].unlimited
      || (form.limits[key].value.trim() !== '' && Number.isInteger(Number(form.limits[key].value)) && Number(form.limits[key].value) >= 0))
  // Cảnh báo khi có giới hạn bị hạ so với hiện tại (null = không giới hạn = cao nhất)
  const lowersLimit = !!editing && formValid && LIMIT_KEYS.some(key => {
    const next = limitValue(key)
    const current = editing[key]
    return next !== null && (current === null || next < current)
  })

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editing || !form || !formValid || saving) return
    setSaving(true)
    try {
      await updateAdminPlan(editing.code, {
        monthlyPrice: isFree ? 0 : Number(form.monthlyPrice),
        yearlyPrice: isFree ? 0 : Number(form.yearlyPrice),
        maxStores: limitValue('maxStores'),
        maxStaff: limitValue('maxStaff'),
        maxProducts: limitValue('maxProducts'),
        maxWarehouses: limitValue('maxWarehouses'),
        version: editing.version,
        reason: form.reason.trim() || undefined,
      })
      toast.success(copy.saved)
      setEditing(null)
      await load()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setEditing(null)
        toast.error(copy.reloadConflict)
        void load()
      } else toast.error(errorMessage(err, t))
    } finally {
      setSaving(false)
    }
  }

  const limitText = (value: number | null) => value === null ? copy.unlimited : value.toLocaleString()

  return <div className="mx-auto w-full max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
    <PageHeader title={copy.title} subtitle={copy.description}>
      <Button variant="outline" disabled={loading || saving} onClick={load}><RefreshCw className="size-4" />{admin.refresh}</Button>
    </PageHeader>
    <div className="space-y-1 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
      <p>{copy.pricingHint}</p>
      <p>{copy.limitsHint}</p>
    </div>

    {loading ? <div className="flex items-center gap-2 py-12 text-muted-foreground" role="status"><Loader2 className="size-5 animate-spin" />{t.common.loading}</div> : error ?
      <div role="alert" className="space-y-3 rounded-xl border p-5"><p className="text-sm text-destructive">{error}</p><Button variant="outline" onClick={load}>{t.common.retry}</Button></div> :
      <div className="grid gap-4 lg:grid-cols-3">{plans.map(plan => <section key={plan.code} className="flex flex-col gap-5 rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3"><Layers className="mt-1 size-5 shrink-0 text-primary" /><div>
            <h2 className="font-semibold">{planNames[plan.code]}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{(plan.code === 'FREE' ? copy.affectedFree : copy.affected).replace('{count}', String(plan.affectedBusinesses))}</p>
          </div></div>
          <Button variant="outline" size="sm" disabled={saving} onClick={() => openEditor(plan)}><Pencil className="size-4" />{copy.edit}</Button>
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copy.pricing}</h3>
          <p className="text-sm"><span className="font-semibold">{formatCurrency(plan.monthlyPrice)}</span> <span className="text-muted-foreground">{copy.perMonth}</span></p>
          <p className="text-sm"><span className="font-semibold">{formatCurrency(plan.yearlyPrice)}</span> <span className="text-muted-foreground">{copy.perYear}</span></p>
        </div>
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copy.limits}</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {LIMIT_KEYS.map(key => <div key={key} className="contents"><dt className="text-muted-foreground">{copy[key]}</dt><dd className="text-right font-medium">{limitText(plan[key])}</dd></div>)}
          </dl>
        </div>
        <p className="mt-auto border-t pt-3 text-xs text-muted-foreground">{copy.updatedAt}: {new Date(plan.updatedAt).toLocaleString()}</p>
      </section>)}</div>}

    <Dialog open={!!editing} onOpenChange={open => { if (!open && !saving) setEditing(null) }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{editing ? copy.editTitle.replace('{plan}', planNames[editing.code]) : ''}</DialogTitle>
        <DialogDescription>{editing && (editing.code === 'FREE' ? copy.affectedFree : copy.affected).replace('{count}', String(editing.affectedBusinesses))}</DialogDescription>
      </DialogHeader>
      {form && <form onSubmit={save} className="space-y-5">
        <fieldset className="space-y-3" disabled={saving}>
          <legend className="text-sm font-medium">{copy.pricing}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {(['monthlyPrice', 'yearlyPrice'] as const).map(key => <div key={key} className="space-y-2">
              <Label htmlFor={`plan-${key}`}>{copy[key]}</Label>
              <Input id={`plan-${key}`} type="number" min={0} step="1000" required disabled={isFree}
                value={isFree ? '0' : form[key]} onChange={event => setForm(previous => previous && ({ ...previous, [key]: event.target.value }))} />
            </div>)}
          </div>
          {isFree && <p className="text-xs text-muted-foreground">{copy.freePrice}</p>}
        </fieldset>

        <fieldset className="space-y-3" disabled={saving}>
          <legend className="text-sm font-medium">{copy.limits}</legend>
          {LIMIT_KEYS.map(key => {
            const limit = form.limits[key]
            const setLimit = (patch: Partial<typeof limit>) =>
              setForm(previous => previous && ({ ...previous, limits: { ...previous.limits, [key]: { ...previous.limits[key], ...patch } } }))
            return <div key={key} className="grid grid-cols-[1fr_8rem_auto] items-center gap-3">
              <Label htmlFor={`plan-${key}`}>{copy[key]}</Label>
              <Input id={`plan-${key}`} type="number" min={0} step={1} required={!limit.unlimited} disabled={limit.unlimited}
                value={limit.unlimited ? '' : limit.value} onChange={event => setLimit({ value: event.target.value })} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="size-4 accent-primary" checked={limit.unlimited} onChange={event => setLimit({ unlimited: event.target.checked })} />
                {copy.unlimited}
              </label>
            </div>
          })}
        </fieldset>

        {lowersLimit && <p role="status" className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />{copy.lowerWarning}
        </p>}

        <AdminReasonField value={form.reason} onChange={value => setForm(previous => previous && ({ ...previous, reason: value }))} disabled={saving} />
        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={() => setEditing(null)}>{t.common.cancel}</Button>
          <Button type="submit" disabled={saving || !formValid}>{saving && <Loader2 className="size-4 animate-spin" />}{copy.save}</Button>
        </DialogFooter>
      </form>}
    </DialogContent></Dialog>
  </div>
}
