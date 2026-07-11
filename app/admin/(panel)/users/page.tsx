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
      toast.error(err instanceof Error ? err.message : ts.userMgmtLoadError)
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
      toast.error(err instanceof Error ? err.message : ts.userMgmtStatusError)
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
      toast.error(err instanceof Error ? err.message : ts.userMgmtDeleteError)
    } finally {
      setIsDeletingUser(false)
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">{ts.userMgmtTitle}</h1>
        <p className="text-sm text-slate-400 mt-1">{ts.userMgmtSubtitle}</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <Input
          className="pl-9 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
          placeholder={ts.userMgmtSearch}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="pl-5 text-slate-400">{ts.userMgmtColUser}</TableHead>
              <TableHead className="text-slate-400">{ts.userMgmtColEmail}</TableHead>
              <TableHead className="text-slate-400">{ts.userMgmtColStatus}</TableHead>
              <TableHead className="text-slate-400">{ts.userMgmtColCreated}</TableHead>
              <TableHead className="pr-5 text-right text-slate-400">{ts.userMgmtColActions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin text-slate-500" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-sm text-slate-500">
                  {ts.userMgmtNoUsers}
                </TableCell>
              </TableRow>
            ) : users.map(user => (
              <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50">
                <TableCell className="pl-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-200">{user.fullName || user.username}</span>
                    <span className="text-xs text-slate-500">@{user.username}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-slate-400">{user.email}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={user.isActive
                      ? 'bg-emerald-900/60 text-emerald-300'
                      : 'bg-slate-700 text-slate-400'}
                  >
                    {user.isActive ? ts.userMgmtActive : ts.userMgmtInactive}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-slate-500">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell className="pr-5">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1.5 border-slate-700 text-slate-300 hover:bg-slate-800"
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
                      className="h-7 gap-1.5 border-red-700 text-red-400 hover:bg-red-900/30"
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
          <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3">
            <p className="text-sm text-slate-500">Page {page + 1} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0 || isLoading}
                className="border-slate-700 text-slate-300 hover:bg-slate-800">Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1 || isLoading}
                className="border-slate-700 text-slate-300 hover:bg-slate-800">Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle>{ts.userMgmtDeleteTitle}</DialogTitle>
            <DialogDescription className="text-slate-400">{ts.userMgmtDeleteDesc}</DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-sm">
              <p className="font-medium text-slate-200">{deleteTarget.fullName || deleteTarget.username}</p>
              <p className="text-slate-400">{deleteTarget.email}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeletingUser}
              className="border-slate-700 text-slate-300 hover:bg-slate-800">Cancel</Button>
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
