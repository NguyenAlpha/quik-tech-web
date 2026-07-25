'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Building2, User, Mail, Phone, MapPin, Pencil, Check, Plus,
  Crown, ShieldCheck, Shield, ExternalLink, UserCog,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageSkeleton } from '@/components/page-skeleton'
import { PageError } from '@/components/page-error'
import { useAuth } from '@/lib/auth-context'
import { useLanguage } from '@/lib/language-context'
import {
  getBusiness, getBusinessSubscription, updateBusiness, createStore,
} from '@/lib/api'
import type { Business, BusinessSubscription, UpdateBusinessInput } from '@/lib/types'

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const planStyles: Record<string, { label: string; className: string }> = {
  FREE:  { label: 'Free',  className: 'bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300' },
  BASIC: { label: 'Basic', className: 'bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-950 dark:text-blue-400' },
  PRO:   { label: 'Pro',   className: 'bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-950 dark:text-amber-400' },
}

const roleStyles: Record<string, { className: string; icon: React.ElementType }> = {
  ROLE_OWNER:            { className: 'bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-950 dark:text-amber-400',  icon: Crown },
  ROLE_BUSINESS_MANAGER: { className: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-50 dark:bg-indigo-950 dark:text-indigo-400', icon: UserCog },
  ROLE_MANAGER:          { className: 'bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-950 dark:text-blue-400',      icon: ShieldCheck },
  ROLE_STAFF:            { className: 'bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400',    icon: Shield },
}

export default function SettingsPage() {
  const { user, businessId, memberships } = useAuth()
  const { t } = useLanguage()
  const ts = t.subscription
  const tset = t.settings

  const roleLabels: Record<string, string> = {
    ROLE_OWNER: tset.roleOwner,
    ROLE_BUSINESS_MANAGER: tset.roleBusinessManager,
    ROLE_MANAGER: tset.roleManager,
    ROLE_STAFF: tset.roleStaff,
  }

  const [business, setBusiness] = useState<Business | null>(null)
  const [subscription, setSubscription] = useState<BusinessSubscription | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState<UpdateBusinessInput>({ name: '', address: '', phone: '', email: '' })
  const [formError, setFormError] = useState<string | null>(null)

  const [isNewStoreOpen, setIsNewStoreOpen] = useState(false)
  const [isStoreSaving, setIsStoreSaving] = useState(false)
  const [storeForm, setStoreForm] = useState({ name: '', address: '', phone: '', email: '' })
  const [storeFormError, setStoreFormError] = useState<string | null>(null)

  const currentMembership = memberships.find(m => m.businessId === businessId)
  const userRole = currentMembership?.stores[0]?.role ?? ''
  const roleStyle = roleStyles[userRole]

  const [pageError, setPageError] = useState<string | null>(null)

  const init = async () => {
    if (!businessId) { setIsPageLoading(false); return }
    setIsPageLoading(true)
    setPageError(null)
    try {
      const [biz, sub] = await Promise.all([
        getBusiness(businessId),
        getBusinessSubscription(businessId),
      ])
      setBusiness(biz)
      setSubscription(sub)
    } catch (err) {
      setPageError(err instanceof Error ? err.message : tset.loadFailed)
    } finally {
      setIsPageLoading(false)
    }
  }

  useEffect(() => { init() }, [businessId])

  const openEdit = () => {
    if (!business) return
    setForm({ name: business.name, address: business.address ?? '', phone: business.phone ?? '', email: business.email ?? '' })
    setFormError(null)
    setIsEditOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError(tset.businessNameRequired); return }
    if (!businessId) return
    setIsSaving(true)
    setFormError(null)
    try {
      const updated = await updateBusiness(businessId, {
        name: form.name.trim(),
        address: form.address?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        email: form.email?.trim() || undefined,
      })
      setBusiness(updated)
      setIsEditOpen(false)
      toast.success(tset.businessUpdated)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : tset.saveFailed)
    } finally {
      setIsSaving(false)
    }
  }

  const openNewStore = () => {
    setStoreForm({ name: '', address: '', phone: '', email: '' })
    setStoreFormError(null)
    setIsNewStoreOpen(true)
  }

  const handleCreateStore = async () => {
    if (!storeForm.name.trim()) { setStoreFormError(tset.storeNameRequired); return }
    if (!businessId) return
    setIsStoreSaving(true)
    setStoreFormError(null)
    try {
      await createStore(businessId, {
        name: storeForm.name.trim(),
        address: storeForm.address.trim() || undefined,
        phone: storeForm.phone.trim() || undefined,
        email: storeForm.email.trim() || undefined,
      })
      setIsNewStoreOpen(false)
      toast.success(tset.storeCreated)
    } catch (err) {
      setStoreFormError(err instanceof Error ? err.message : tset.storeCreateFailed)
    } finally {
      setIsStoreSaving(false)
    }
  }

  if (isPageLoading) return <PageSkeleton />
  if (pageError) return <PageError message={pageError} onRetry={init} />

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:p-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{tset.title}</h1>
        <p className="text-base text-muted-foreground">{tset.subtitle}</p>
      </div>

      <Tabs defaultValue="business" className="space-y-8">
        <TabsList className="h-11 p-1">
          <TabsTrigger value="business" className="gap-2 px-4">
            <Building2 className="size-4" />
            <span className="hidden sm:inline">{tset.tabBusiness}</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2 px-4">
            <User className="size-4" />
            <span className="hidden sm:inline">{tset.tabProfile}</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Business Tab ── */}
        <TabsContent value="business" className="space-y-6">
          <div className="flex justify-end">
            <Button size="sm" className="gap-2 shadow-sm" onClick={openNewStore}>
              <Plus className="size-4" />
              {tset.newStore}
            </Button>
          </div>

          {/* Business Info */}
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-6">
              <div className="space-y-1.5">
                <CardTitle className="text-xl font-semibold">{tset.businessInfo}</CardTitle>
                <CardDescription className="text-sm">{tset.businessInfoDesc}</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={openEdit}>
                <Pencil className="size-3.5" />
                {tset.edit}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-sm text-muted-foreground">{tset.businessName}</p>
                  <p className="text-sm font-medium">{business?.name ?? '—'}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="size-4" />
                    {tset.email}
                  </div>
                  <p className="text-sm font-medium">{business?.email ?? '—'}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="size-4" />
                    {tset.phone}
                  </div>
                  <p className="text-sm font-medium">{business?.phone ?? '—'}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4" />
                    {tset.address}
                  </div>
                  <p className="text-sm font-medium">{business?.address ?? '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription summary */}
          {subscription && (
            <Card>
              <CardContent className="flex items-center justify-between py-6">
                <div className="space-y-1.5">
                  <p className="text-sm text-muted-foreground">{ts.title}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={planStyles[subscription.plan]?.className}>
                      {planStyles[subscription.plan]?.label ?? subscription.plan}
                    </Badge>
                    {subscription.expiresAt && (
                      <span className="text-xs text-muted-foreground">
                        {tset.expires} {new Date(subscription.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link href="/subscription">
                    <ExternalLink className="size-4" />
                    {tset.manageSubscription}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Profile Tab ── */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold">{tset.userProfile}</CardTitle>
              <CardDescription className="text-sm">{tset.userProfileDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="size-16 border-2">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-xl font-semibold text-white">
                    {user ? getInitials(user.fullName) : '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-semibold">{user?.fullName}</h3>
                  {roleStyle && (() => {
                    const RoleIcon = roleStyle.icon
                    return (
                      <Badge variant="secondary" className={roleStyle.className}>
                        <RoleIcon className="mr-1 size-3" />
                        {roleLabels[userRole] ?? userRole}
                      </Badge>
                    )
                  })()}
                </div>
              </div>

              <Separator />

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-sm text-muted-foreground">{tset.username}</p>
                  <p className="text-sm font-medium">{user?.username}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="size-4" />
                    {tset.email}
                  </div>
                  <p className="text-sm font-medium">{user?.email}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="size-4" />
                    {tset.phone}
                  </div>
                  <p className="text-sm font-medium">{user?.phone ?? '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── New Store Modal ── */}
      <Dialog open={isNewStoreOpen} onOpenChange={open => { if (!open) { setIsNewStoreOpen(false); setStoreForm({ name: '', address: '', phone: '', email: '' }); setStoreFormError(null) } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{tset.newStore}</DialogTitle>
            <DialogDescription>{tset.newStoreDesc}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="store-name">{tset.storeName}</Label>
              <Input id="store-name" value={storeForm.name} onChange={e => setStoreForm(p => ({ ...p, name: e.target.value }))} className="h-10" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="store-email">{tset.email}</Label>
                <Input id="store-email" type="email" value={storeForm.email} onChange={e => setStoreForm(p => ({ ...p, email: e.target.value }))} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-phone">{tset.phone}</Label>
                <Input id="store-phone" value={storeForm.phone} onChange={e => setStoreForm(p => ({ ...p, phone: e.target.value }))} className="h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-address">{tset.address}</Label>
              <Input id="store-address" value={storeForm.address} onChange={e => setStoreForm(p => ({ ...p, address: e.target.value }))} className="h-10" />
            </div>
            {storeFormError && <p className="text-sm text-red-500">{storeFormError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewStoreOpen(false)} disabled={isStoreSaving}>{t.common.cancel}</Button>
            <Button onClick={handleCreateStore} disabled={isStoreSaving} className="gap-2">
              {isStoreSaving ? tset.creating : <><Check className="size-4" />{tset.createStore}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Business Modal ── */}
      <Dialog open={isEditOpen} onOpenChange={open => { if (!open) { setIsEditOpen(false); setFormError(null) } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{tset.editBusiness}</DialogTitle>
            <DialogDescription>{tset.editBusinessDesc}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="biz-name">{tset.businessName}</Label>
              <Input id="biz-name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="h-10" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="biz-email">{tset.email}</Label>
                <Input id="biz-email" type="email" value={form.email ?? ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="biz-phone">{tset.phone}</Label>
                <Input id="biz-phone" value={form.phone ?? ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="biz-address">{tset.address}</Label>
              <Input id="biz-address" value={form.address ?? ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="h-10" />
            </div>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSaving}>{t.common.cancel}</Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? tset.saving : <><Check className="size-4" />{tset.saveChanges}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
