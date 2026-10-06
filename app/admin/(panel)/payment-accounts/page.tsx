'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Landmark, Plus, Pencil, Archive, Check, Loader2, RefreshCw, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminReasonField } from '@/components/admin-reason-field'
import { PaymentBankDetails } from '@/components/payment-bank-details'
import { useLanguage } from '@/lib/language-context'
import { useAdminCopy } from '@/lib/admin-copy'
import { usePaymentAccountCopy } from '@/lib/payment-account-copy'
import { ApiError } from '@/lib/api'
import { errorMessage } from '@/lib/api-error'
import { getPaymentAccounts, savePaymentAccount, changePaymentAccount, type PaymentAccount, type PaymentAccountInput } from '@/lib/payment-accounts'

const emptyForm: PaymentAccountInput = { label: '', bankName: '', accountNumber: '', accountHolder: '', branch: '', reason: '' }

export default function PaymentAccountsPage() {
  const { t } = useLanguage()
  const copy = usePaymentAccountCopy()
  const admin = useAdminCopy()
  const [accounts, setAccounts] = useState<PaymentAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('available')
  const [editor, setEditor] = useState<{ account?: PaymentAccount } | null>(null)
  const [form, setForm] = useState<PaymentAccountInput>(emptyForm)
  const [target, setTarget] = useState<{ account: PaymentAccount; action: 'activate' | 'archive' } | null>(null)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const requestId = useRef(0)
  const load = useCallback(async () => {
    const request = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const result = await getPaymentAccounts()
      if (request === requestId.current) setAccounts(result)
    } catch (err) {
      if (request === requestId.current) setError(errorMessage(err, t))
    } finally {
      if (request === requestId.current) setLoading(false)
    }
  }, [t])
  useEffect(() => { void load(); return () => { requestId.current++ } }, [load])

  const active = accounts.find(account => account.active)
  const visible = accounts.filter(account => filter === 'all' || (filter === 'archived' ? account.archived : !account.archived))
    .sort((a, b) => Number(b.active) - Number(a.active))

  const openEditor = (account?: PaymentAccount) => {
    setForm(account ? { label: account.label, bankName: account.bankName, accountNumber: account.accountNumber, accountHolder: account.accountHolder, branch: account.branch, version: account.version, reason: '' } : { ...emptyForm })
    setEditor({ account })
  }
  const mutationError = (err: unknown) => {
    if (err instanceof ApiError && err.status === 409) {
      setEditor(null)
      setTarget(null)
      toast.error(copy.reloadConflict)
      void load()
    } else toast.error(errorMessage(err, t))
  }
  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editor || saving) return
    setSaving(true)
    try {
      await savePaymentAccount({ ...form, label: form.label.trim(), bankName: form.bankName.trim(), accountNumber: form.accountNumber.trim(), accountHolder: form.accountHolder.trim(), branch: form.branch.trim(), reason: form.reason?.trim() }, editor.account?.id)
      toast.success(editor.account ? copy.saved : copy.created)
      setEditor(null)
      await load()
    } catch (err) { mutationError(err) } finally { setSaving(false) }
  }
  const act = async () => {
    if (!target || saving) return
    setSaving(true)
    try {
      await changePaymentAccount(target.account, target.action, reason)
      toast.success(target.action === 'activate' ? copy.activated : copy.archivedSuccess)
      setTarget(null)
      await load()
    } catch (err) { mutationError(err) } finally { setSaving(false) }
  }

  return <div className="mx-auto w-full max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
    <PageHeader title={copy.title} subtitle={copy.description}>
      <Button onClick={() => openEditor()} disabled={loading || !!error || saving}><Plus className="size-4" />{copy.add}</Button>
    </PageHeader>
    <p className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">{copy.futureOnly}</p>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Tabs value={filter} onValueChange={setFilter}><TabsList className="h-auto flex-wrap"><TabsTrigger value="available">{copy.available}</TabsTrigger><TabsTrigger value="archived">{copy.archived}</TabsTrigger><TabsTrigger value="all">{copy.all}</TabsTrigger></TabsList></Tabs>
      <Button variant="outline" disabled={loading || saving} onClick={load}><RefreshCw className="size-4" />{admin.refresh}</Button>
    </div>
    {loading ? <div className="flex items-center gap-2 py-12 text-muted-foreground" role="status"><Loader2 className="size-5 animate-spin" />{t.common.loading}</div> : error ?
      <div role="alert" className="space-y-3 rounded-xl border p-5"><p className="text-sm text-destructive">{error}</p><Button variant="outline" onClick={load}>{t.common.retry}</Button></div> : <>
        {!active && <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">{copy.noActive}</p>}
        {!visible.length ? <div className="rounded-xl border bg-card p-8 text-center"><Landmark className="mx-auto mb-3 size-8 text-muted-foreground" /><p>{copy.empty}</p>{!accounts.length && <p className="mt-2 text-sm text-muted-foreground">{copy.setup}</p>}</div> :
          <div className="grid gap-4 lg:grid-cols-2">{visible.map(account => <section key={account.id} className={`space-y-5 rounded-xl border bg-card p-5 shadow-sm ${account.active ? 'border-primary ring-1 ring-primary/20' : ''}`}>
            <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><Landmark className="mt-1 size-5 shrink-0 text-primary" /><div className="min-w-0"><h2 className="break-words font-semibold">{account.label}</h2><p className="mt-1 text-xs text-muted-foreground">#{account.id}</p></div></div><Badge variant={account.active ? 'default' : 'secondary'}>{account.active ? copy.active : account.archived ? copy.archived : copy.available}</Badge></div>
            <PaymentBankDetails info={account} />
            {!account.archived && <div className="flex flex-wrap gap-2 border-t pt-4">
              {!account.active && <Button size="sm" disabled={saving} onClick={() => { setReason(''); setTarget({ account, action: 'activate' }) }}><Check className="size-4" />{copy.activate}</Button>}
              <Button variant="outline" size="sm" disabled={saving} onClick={() => openEditor(account)}><Pencil className="size-4" />{copy.edit}</Button>
              <Button variant="outline" size="sm" disabled={saving || account.active} title={account.active ? copy.archiveActiveHint : undefined} onClick={() => { setReason(''); setTarget({ account, action: 'archive' }) }}><Archive className="size-4" />{copy.archive}</Button>
            </div>}
          </section>)}</div>}
      </>}

    <Dialog open={!!editor} onOpenChange={open => { if (!open && !saving) setEditor(null) }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
      <DialogHeader><DialogTitle>{editor?.account ? copy.edit : copy.add}</DialogTitle><DialogDescription>{copy.editHint}</DialogDescription></DialogHeader>
      <form onSubmit={save} className="space-y-4">
        {([{ key: 'label', label: copy.label, max: 100 }, { key: 'bankName', label: copy.bankName, max: 150 }, { key: 'accountNumber', label: copy.accountNumber, max: 50 }, { key: 'accountHolder', label: copy.accountHolder, max: 150 }, { key: 'branch', label: copy.branch, max: 150 }] as const).map(field => <div key={field.key} className="space-y-2"><Label htmlFor={`account-${field.key}`}>{field.label}</Label><Input id={`account-${field.key}`} value={form[field.key]} onChange={event => setForm(previous => ({ ...previous, [field.key]: event.target.value }))} required={field.key !== 'branch'} maxLength={field.max} pattern={field.key === 'accountNumber' ? '[A-Za-z0-9]{4,50}' : undefined} disabled={saving} autoComplete="off" /></div>)}
        <AdminReasonField value={form.reason || ''} onChange={value => setForm(previous => ({ ...previous, reason: value }))} disabled={saving} />
        <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={() => setEditor(null)}>{t.common.cancel}</Button><Button type="submit" disabled={saving}>{saving && <Loader2 className="size-4 animate-spin" />}{copy.save}</Button></DialogFooter>
      </form>
    </DialogContent></Dialog>

    <Dialog open={!!target} onOpenChange={open => { if (!open && !saving) setTarget(null) }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
      <DialogHeader><DialogTitle>{target?.action === 'activate' ? copy.switchTitle : copy.archiveTitle}</DialogTitle><DialogDescription>{target?.action === 'activate' ? copy.switchHint : copy.archiveHint}</DialogDescription></DialogHeader>
      {target?.action === 'activate' && <><div className="space-y-3 rounded-lg border bg-muted/30 p-4"><h3 className="text-sm font-medium">{copy.previous}</h3>{active ? <PaymentBankDetails info={active} /> : <p className="text-sm text-muted-foreground">{copy.none}</p>}</div><ArrowDown className="mx-auto size-4 text-muted-foreground" /></>}
      {target && <div className="space-y-3 rounded-lg border p-4"><h3 className="break-words text-sm font-semibold">{target.action === 'activate' ? `${copy.next}: ` : ''}{target.account.label}</h3><PaymentBankDetails info={target.account} /></div>}
      <AdminReasonField value={reason} onChange={setReason} disabled={saving} />
      <DialogFooter><Button variant="outline" disabled={saving} onClick={() => setTarget(null)}>{t.common.cancel}</Button><Button disabled={saving} onClick={act}>{saving && <Loader2 className="size-4 animate-spin" />}{target?.action === 'activate' ? copy.activate : copy.archive}</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>
}
