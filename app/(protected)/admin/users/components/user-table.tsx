'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontalIcon } from 'lucide-react'
import type { UserFilters, UserRow } from '@/types/users-admin'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { Button } from '@/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import { Skeleton } from '@/ui/skeleton'
import { displayEmail, shortWalletAddress } from '@/utils/profile'
import { MembershipStatusBadge } from './membership-status-badge'
import { UserDeleteDialog } from './user-delete-dialog'
import { UserDetailDrawer } from './user-detail-drawer'

interface UserTableProps {
  users: UserRow[]
  tiers: { id: string; name: string }[]
  totalCount: number
  currentPage: number
  totalPages: number
  filters: UserFilters
  onSelectionChange?: (selected: UserRow[]) => void
}

export function UserTableSkeleton() {
  return (
    <div className="w-full">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3 border-b border-border"
        >
          <Skeleton className="size-4 rounded" />
          <Skeleton className="size-8 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="size-8 rounded" />
        </div>
      ))}
    </div>
  )
}

function userPrimaryDisplay(user: UserRow): string {
  return (
    user.profile?.nickname ??
    shortWalletAddress(user.walletAddress) ??
    displayEmail(user.email) ??
    user.email
  )
}

function getInitials(user: UserRow): string {
  return userPrimaryDisplay(user).slice(0, 2).toUpperCase()
}

export function UserTable({
  users: initialUsers,
  totalCount,
  currentPage,
  totalPages,
  filters,
  onSelectionChange,
}: UserTableProps) {
  const router = useRouter()
  const [optimisticUsers, setOptimisticUsers] =
    useState<UserRow[]>(initialUsers)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Sync when server re-renders with filtered/paginated data
  useEffect(() => {
    setOptimisticUsers(initialUsers)
    setSelectedIds(new Set())
    onSelectionChange?.([])
  }, [initialUsers]) // eslint-disable-line react-hooks/exhaustive-deps
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null)
  const [deleteDialogUser, setDeleteDialogUser] = useState<UserRow | null>(null)

  const allSelected =
    optimisticUsers.length > 0 &&
    optimisticUsers.every((u) => selectedIds.has(u.id))
  const someSelected = optimisticUsers.some((u) => selectedIds.has(u.id))

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set())
      onSelectionChange?.([])
    } else {
      const all = new Set(optimisticUsers.map((u) => u.id))
      setSelectedIds(all)
      onSelectionChange?.(optimisticUsers)
    }
  }

  function toggleRow(user: UserRow) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(user.id)) {
        next.delete(user.id)
      } else {
        next.add(user.id)
      }
      onSelectionChange?.(optimisticUsers.filter((u) => next.has(u.id)))
      return next
    })
  }

  function buildPageUrl(page: number): string {
    const params = new URLSearchParams(window.location.search)
    params.set('page', String(page))
    return `/admin/community?${params.toString()}`
  }

  async function handleDelete(userId: string) {
    setOptimisticUsers((prev) => prev.filter((u) => u.id !== userId))
    setDeleteDialogUser(null)
    setDrawerUserId(null)

    const res = await fetch(`/api/v1/admin/users/${userId}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      setOptimisticUsers(initialUsers)
    } else {
      router.refresh()
    }
  }

  const from = (currentPage - 1) * filters.pageSize + 1
  const to = Math.min(currentPage * filters.pageSize, totalCount)

  return (
    <>
      <div className="overflow-x-auto">
        <table role="grid" className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 w-10" scope="col">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected
                  }}
                  onChange={toggleAll}
                  className="rounded border-border"
                />
              </th>
              <th
                className="px-4 py-3 text-left font-medium text-muted-foreground"
                scope="col"
              >
                User
              </th>
              <th
                className="hidden sm:table-cell px-4 py-3 text-left font-medium text-muted-foreground"
                scope="col"
              >
                Membership
              </th>
              <th
                className="hidden sm:table-cell px-4 py-3 text-left font-medium text-muted-foreground"
                scope="col"
              >
                Status
              </th>
              <th
                className="hidden sm:table-cell px-4 py-3 text-left font-medium text-muted-foreground sr-only"
                scope="col"
                aria-label="Actions"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {optimisticUsers.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground text-sm"
                >
                  No users found.
                </td>
              </tr>
            )}
            {optimisticUsers.map((user) => {
              const primary = userPrimaryDisplay(user)
              const secondary = displayEmail(user.email)
              const showSecondary = secondary !== null && secondary !== primary
              return (
                <tr
                  key={user.id}
                  onClick={() => setDrawerUserId(user.id)}
                  className="border-b border-border hover:bg-muted/20 cursor-pointer transition-colors"
                >
                  <td
                    className="px-4 py-3 w-10"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleRow(user)
                    }}
                  >
                    <input
                      type="checkbox"
                      aria-label={`Select ${primary}`}
                      checked={selectedIds.has(user.id)}
                      onChange={() => toggleRow(user)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-border"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        {user.profile?.imageUrl && (
                          <AvatarImage
                            src={user.profile.imageUrl}
                            alt={primary}
                          />
                        )}
                        <AvatarFallback className="text-xs">
                          {getInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{primary}</p>
                        {showSecondary && (
                          <p className="text-xs text-muted-foreground">
                            {secondary}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 text-muted-foreground">
                    {user.membership?.tier?.name ?? '—'}
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3">
                    {user.membership ? (
                      <MembershipStatusBadge status={user.membership.status} />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td
                    className="hidden sm:table-cell px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Actions for ${primary}`}
                        >
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => setDrawerUserId(user.id)}
                        >
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => setDeleteDialogUser(user)}
                          className="text-destructive focus:text-destructive"
                        >
                          Delete user
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm text-muted-foreground">
        <span>
          {totalCount > 0
            ? `Showing ${from}–${to} of ${totalCount}`
            : 'No results'}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage <= 1}
            onClick={() => router.push(buildPageUrl(currentPage - 1))}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage >= totalPages}
            onClick={() => router.push(buildPageUrl(currentPage + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      <UserDetailDrawer
        userId={drawerUserId}
        onClose={() => setDrawerUserId(null)}
      />

      {deleteDialogUser && (
        <UserDeleteDialog
          userId={deleteDialogUser.id}
          userEmail={userPrimaryDisplay(deleteDialogUser)}
          open={Boolean(deleteDialogUser)}
          onClose={() => setDeleteDialogUser(null)}
          onConfirm={() => handleDelete(deleteDialogUser.id)}
        />
      )}
    </>
  )
}
