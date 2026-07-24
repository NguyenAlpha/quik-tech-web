"use client"

import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { Crown, UserCog, UserPlus, Loader2, Trash2, Lock } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import {
  getBusinessMembers,
  addBusinessMember,
  setBusinessMemberActive,
  removeBusinessMember,
  lookupUser,
  ApiError,
} from "@/lib/api"
import { PageSkeleton } from "@/components/page-skeleton"
import { PageError } from "@/components/page-error"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { BusinessMember } from "@/lib/types"

export default function TeamPage() {
  const { t } = useLanguage()
  const tt = t.team
  const { businessId, memberships, isLoading: authLoading } = useAuth()

  const isOwner = useMemo(() => {
    const m = memberships.find((x) => x.businessId === businessId)
    return (m?.stores ?? []).some((s) => s.role === "ROLE_OWNER")
  }, [memberships, businessId])

  const [members, setMembers] = useState<BusinessMember[]>([])
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const init = async () => {
    setIsPageLoading(true)
    setPageError(null)
    try {
      setMembers(await getBusinessMembers())
    } catch (err) {
      setPageError(err instanceof ApiError ? err.message : "Failed to load data")
    } finally {
      setIsPageLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!isOwner) { setIsPageLoading(false); return }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isOwner, businessId])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = username.trim()
    if (!name) return
    setIsAdding(true)
    try {
      const found = await lookupUser(name)
      await addBusinessMember(found.userId, true)
      toast.success(tt.added)
      setIsAddOpen(false)
      setUsername("")
      await init()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "USER_NOT_FOUND") toast.error(tt.errUserNotFound)
        else if (err.code === "SUBSCRIPTION_LIMIT_EXCEEDED") toast.error(tt.errStaffLimit)
        else if (err.code === "VALIDATION_ERROR") toast.error(tt.errAlreadyMember)
        else toast.error(err.message)
      } else {
        toast.error(tt.errGeneric)
      }
    } finally {
      setIsAdding(false)
    }
  }

  const handleToggle = async (m: BusinessMember) => {
    setBusyId(m.id)
    try {
      await setBusinessMemberActive(m.id, !m.isActive)
      toast.success(!m.isActive ? tt.activated : tt.deactivated)
      await init()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tt.errGeneric)
    } finally {
      setBusyId(null)
    }
  }

  const handleRemove = async (m: BusinessMember) => {
    if (!confirm(tt.confirmRemove.replace("{name}", m.username))) return
    setBusyId(m.id)
    try {
      await removeBusinessMember(m.id)
      toast.success(tt.removed)
      await init()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tt.errGeneric)
    } finally {
      setBusyId(null)
    }
  }

  if (authLoading || isPageLoading) return <PageSkeleton />

  if (!isOwner) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6 lg:p-10">
        <PageHeader title={tt.title} subtitle={tt.subtitle} />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Lock className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{tt.ownerOnly}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (pageError) return <PageError message={pageError} onRetry={init} />

  const owner = members.find((m) => m.role === "ROLE_OWNER")
  const assistants = members.filter((m) => m.role === "ROLE_BUSINESS_MANAGER")

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:p-10">
      <PageHeader title={tt.title} subtitle={tt.subtitle}>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2 shadow-sm">
          <UserPlus className="size-4" />
          {tt.addAssistant}
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-left font-medium">{tt.colMember}</th>
                <th className="px-5 py-3 text-left font-medium">{tt.colRole}</th>
                <th className="px-5 py-3 text-left font-medium">{tt.colStatus}</th>
                <th className="px-5 py-3 text-left font-medium">{tt.colJoined}</th>
                <th className="px-5 py-3 text-right font-medium">{tt.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {owner && (
                <tr className="border-b">
                  <td className="px-5 py-3 font-medium">{owner.username}</td>
                  <td className="px-5 py-3">
                    <Badge variant="secondary" className="gap-1 bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-950 dark:text-amber-400">
                      <Crown className="size-3" /> {tt.owner}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant="outline">{owner.isActive ? tt.active : tt.inactive}</Badge>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {owner.joinedDate ? new Date(owner.joinedDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-muted-foreground">—</td>
                </tr>
              )}

              {assistants.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="px-5 py-3 font-medium">{m.username}</td>
                  <td className="px-5 py-3">
                    <Badge variant="secondary" className="gap-1 bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-950 dark:text-blue-400">
                      <UserCog className="size-3" /> {tt.assistant}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={m.isActive ? "outline" : "secondary"}>
                      {m.isActive ? tt.active : tt.inactive}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {m.joinedDate ? new Date(m.joinedDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === m.id}
                        onClick={() => handleToggle(m)}
                      >
                        {busyId === m.id && <Loader2 className="mr-1 size-3.5 animate-spin" />}
                        {m.isActive ? tt.deactivate : tt.activate}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        disabled={busyId === m.id}
                        onClick={() => handleRemove(m)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {assistants.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    {tt.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={(open) => { if (!open) { setIsAddOpen(false); setUsername("") } }}>
        <DialogContent className="max-w-md p-0">
          <form onSubmit={handleAdd}>
            <DialogHeader className="border-b px-6 py-4">
              <DialogTitle>{tt.addTitle}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 p-6">
              <div className="space-y-1.5">
                <Label htmlFor="tm-username">{tt.usernameLabel}</Label>
                <Input
                  id="tm-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={tt.usernamePlaceholder}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">{tt.addHint}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); setUsername("") }}>
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={isAdding || !username.trim()}>
                {isAdding && <Loader2 className="mr-2 size-4 animate-spin" />}
                {tt.addAssistant}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
