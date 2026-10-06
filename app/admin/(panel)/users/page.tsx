'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, Search, Trash2, UserX, UserCheck, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/page-header'
import { AdminTableState } from '@/components/admin-table-state'
import { AdminPagination } from '@/components/admin-pagination'
import { useLanguage } from '@/lib/language-context'
import { useAdminCopy } from '@/lib/admin-copy'
import { errorMessage } from '@/lib/api-error'
import { adminGetUsers, adminSetUserStatus, adminDeleteUser } from '@/lib/api'
import { getInitials } from '@/lib/utils'
import type { AdminUser } from '@/lib/types'

export default function AdminUsersPage() {
  const { t, language } = useLanguage()
  const ts = t.subscription
  const copy = useAdminCopy()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [reload, setReload] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [statusTarget, setStatusTarget] = useState<AdminUser | null>(null)
  const [isDeletingUser, setIsDeletingUser] = useState(false)
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const locale = language === 'vi' ? 'vi-VN' : 'en-US'

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim())
      setPage(0)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)
    adminGetUsers({ q: query || undefined, page, size: 20 })
      .then((result) => {
        if (cancelled) return
        setUsers(result.content)
        setTotalPages(result.totalPages)
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, t, ts.userMgmtLoadError))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, query, reload, t, ts.userMgmtLoadError])

  const handleToggleStatus = async () => {
    if (!statusTarget || isChangingStatus) return
    setIsChangingStatus(true)
    try {
      const updated = await adminSetUserStatus(statusTarget.id, !statusTarget.isActive)
      setUsers((prev) => prev.map((user) => (user.id === updated.id ? updated : user)))
      setStatusTarget(null)
      toast.success(ts.userMgmtStatusSuccess)
    } catch (err) {
      toast.error(errorMessage(err, t, ts.userMgmtStatusError))
    } finally {
      setIsChangingStatus(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || isDeletingUser) return
    setIsDeletingUser(true)
    try {
      await adminDeleteUser(deleteTarget.id)
      setDeleteTarget(null)
      if (users.length === 1 && page > 0) setPage(page - 1)
      else setReload((value) => value + 1)
      toast.success(ts.userMgmtDeleteSuccess)
    } catch (err) {
      toast.error(errorMessage(err, t, ts.userMgmtDeleteError))
    } finally {
      setIsDeletingUser(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={copy.users} subtitle={ts.userMgmtSubtitle}>
        <Button
          variant="outline"
          className="gap-2 self-start"
          onClick={() => setReload((value) => value + 1)}
          disabled={isLoading}
        >
          <RefreshCw className="size-4" />
          {copy.refresh}
        </Button>
      </PageHeader>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:px-5">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="bg-background pl-9"
              aria-label={ts.userMgmtSearch}
              placeholder={ts.userMgmtSearch}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <span className="text-xs text-muted-foreground">{copy.users}</span>
        </div>
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">{ts.userMgmtColUser}</TableHead>
              <TableHead>{ts.userMgmtColStatus}</TableHead>
              <TableHead>{ts.userMgmtColCreated}</TableHead>
              <TableHead className="pr-5 text-right">{ts.userMgmtColActions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || error || users.length === 0 ? (
              <AdminTableState
                columns={4}
                loading={isLoading}
                error={error}
                emptyMessage={ts.userMgmtNoUsers}
                onRetry={() => setReload((value) => value + 1)}
              />
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="py-4 pl-5">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-primary/10 text-xs text-primary">
                          {getInitials(user.fullName || user.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium">{user.fullName || user.username}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        user.isActive
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-muted text-muted-foreground'
                      }
                    >
                      {user.isActive ? ts.userMgmtActive : ts.userMgmtInactive}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString(locale) : '—'}
                  </TableCell>
                  <TableCell className="pr-5">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setStatusTarget(user)}>
                        {user.isActive ? <UserX className="size-3.5" /> : <UserCheck className="size-3.5" />}
                        {user.isActive ? ts.userMgmtDeactivate : ts.userMgmtActivate}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleteTarget(user)}
                      >
                        <Trash2 className="size-3.5" />
                        {ts.userMgmtDelete}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <AdminPagination
          page={page}
          totalPages={totalPages}
          disabled={isLoading || !!error || search.trim() !== query}
          onPageChange={setPage}
        />
      </div>

      <Dialog
        open={!!statusTarget}
        onOpenChange={(open) => {
          if (!open && !isChangingStatus) setStatusTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{copy.confirmStatusTitle}</DialogTitle>
            <DialogDescription>{copy.confirmStatusDescription}</DialogDescription>
          </DialogHeader>
          {statusTarget && (
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              <p className="font-medium">{statusTarget.fullName || statusTarget.username}</p>
              <p className="break-all text-muted-foreground">{statusTarget.email}</p>
              <p className="mt-3 font-medium">{statusTarget.isActive ? ts.userMgmtDeactivate : ts.userMgmtActivate}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" disabled={isChangingStatus} onClick={() => setStatusTarget(null)}>
              {t.common.cancel}
            </Button>
            <Button
              variant={statusTarget?.isActive ? 'destructive' : 'default'}
              disabled={isChangingStatus}
              onClick={handleToggleStatus}
            >
              {isChangingStatus && <Loader2 className="size-4 animate-spin" />}
              {statusTarget?.isActive ? ts.userMgmtDeactivate : ts.userMgmtActivate}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !isDeletingUser) setDeleteTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{ts.userMgmtDeleteTitle}</DialogTitle>
            <DialogDescription>{ts.userMgmtDeleteDesc}</DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              <p className="font-medium">{deleteTarget.fullName || deleteTarget.username}</p>
              <p className="break-all text-muted-foreground">{deleteTarget.email}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeletingUser}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeletingUser} className="gap-2">
              {isDeletingUser ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {ts.userMgmtDeleteConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
