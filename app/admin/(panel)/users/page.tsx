'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Loader2, Search, Trash2, UserX, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useLanguage } from '@/lib/language-context'
import { errorMessage } from '@/lib/api-error'
import { adminGetUsers, adminSetUserStatus, adminDeleteUser } from '@/lib/api'
import type { AdminUser } from '@/lib/types'

export default function AdminUsersPage() {
  const { t } = useLanguage()
  const ts = t.subscription

  const [users, setUsers] = useState<AdminUser[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [isDeletingUser, setIsDeletingUser] = useState(false)
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { loadUsers() }, [page])

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(0)
      loadUsers(search)
    }, 400)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [search])

  const loadUsers = async (q = search) => {
    setIsLoading(true)
    try {
      const result = await adminGetUsers({ q: q || undefined, page, size: 20 })
      setUsers(result.content)
      setTotalPages(result.totalPages)
    } catch (err) {
      toast.error(errorMessage(err, t, ts.userMgmtLoadError))
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleStatus = async (user: AdminUser) => {
    setTogglingUserId(user.id)
    try {
      const updated = await adminSetUserStatus(user.id, !user.isActive)
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
      toast.success(ts.userMgmtStatusSuccess)
    } catch (err) {
      toast.error(errorMessage(err, t, ts.userMgmtStatusError))
    } finally {
      setTogglingUserId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeletingUser(true)
    try {
      await adminDeleteUser(deleteTarget.id)
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
      setDeleteTarget(null)
      toast.success(ts.userMgmtDeleteSuccess)
    } catch (err) {
      toast.error(errorMessage(err, t, ts.userMgmtDeleteError))
    } finally {
      setIsDeletingUser(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{ts.userMgmtTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">{ts.userMgmtSubtitle}</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground"
          placeholder={ts.userMgmtSearch}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="pl-5 text-muted-foreground">{ts.userMgmtColUser}</TableHead>
              <TableHead className="text-muted-foreground">{ts.userMgmtColEmail}</TableHead>
              <TableHead className="text-muted-foreground">{ts.userMgmtColStatus}</TableHead>
              <TableHead className="text-muted-foreground">{ts.userMgmtColCreated}</TableHead>
              <TableHead className="pr-5 text-right text-muted-foreground">{ts.userMgmtColActions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                  {ts.userMgmtNoUsers}
                </TableCell>
              </TableRow>
            ) : users.map(user => (
              <TableRow key={user.id} className="border-border hover:bg-muted/50">
                <TableCell className="pl-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{user.fullName || user.username}</span>
                    <span className="text-xs text-muted-foreground">@{user.username}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={user.isActive
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-muted text-muted-foreground'}
                  >
                    {user.isActive ? ts.userMgmtActive : ts.userMgmtInactive}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell className="pr-5">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1.5 border-border text-foreground hover:bg-muted"
                      disabled={togglingUserId === user.id}
                      onClick={() => handleToggleStatus(user)}
                    >
                      {togglingUserId === user.id
                        ? <Loader2 className="size-3.5 animate-spin" />
                        : user.isActive
                          ? <UserX className="size-3.5" />
                          : <UserCheck className="size-3.5" />}
                      {user.isActive ? ts.userMgmtDeactivate : ts.userMgmtActivate}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1.5 border-red-700 text-destructive hover:bg-red-900/30"
                      onClick={() => setDeleteTarget(user)}
                    >
                      <Trash2 className="size-3.5" />
                      {ts.userMgmtDelete}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0 || isLoading}
                className="border-border text-foreground hover:bg-muted">Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1 || isLoading}
                className="border-border text-foreground hover:bg-muted">Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>{ts.userMgmtDeleteTitle}</DialogTitle>
            <DialogDescription className="text-muted-foreground">{ts.userMgmtDeleteDesc}</DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm">
              <p className="font-medium text-foreground">{deleteTarget.fullName || deleteTarget.username}</p>
              <p className="text-muted-foreground">{deleteTarget.email}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeletingUser}
              className="border-border text-foreground hover:bg-muted">Cancel</Button>
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
