'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MailIcon, MessageSquareIcon, PhoneIcon } from 'lucide-react'
import type { MembershipStatus, UserDetail } from '@/types/users-admin'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { Button } from '@/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/ui/drawer'
import { ScrollArea } from '@/ui/scroll-area'
import { Skeleton } from '@/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'
import { displayEmail, shortWalletAddress } from '@/utils/profile'
import { CopyField } from './copy-field'
import { MembershipStatusBadge } from './membership-status-badge'
import { UserDeleteDialog } from './user-delete-dialog'

interface UserDetailDrawerProps {
  userId: string | null
  onClose: () => void
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

function getInitials(user: UserDetail): string {
  const name =
    user.profile?.nickname ??
    shortWalletAddress(user.walletAddress) ??
    displayEmail(user.email) ??
    user.email
  return name.slice(0, 2).toUpperCase()
}

function DrawerSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  )
}

export function UserDetailDrawer({ userId, onClose }: UserDetailDrawerProps) {
  const router = useRouter()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [adminPending, setAdminPending] = useState<boolean | null>(null)
  const [savingAdmin, setSavingAdmin] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)

  const fetchUser = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    setUser(null)
    try {
      const res = await fetch(`/api/v1/admin/users/${id}`)
      if (!res.ok) throw new Error('Failed to load user')
      setUser(await res.json())
    } catch {
      setError('Could not load user details.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (userId) fetchUser(userId)
  }, [userId, fetchUser])

  async function handleDelete() {
    if (!userId) return
    const res = await fetch(`/api/v1/admin/users/${userId}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Delete failed')
    setDeleteOpen(false)
    onClose()
    router.refresh()
  }

  async function handleAdminConfirm() {
    if (!userId || adminPending === null) return
    setSavingAdmin(true)
    try {
      await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: adminPending }),
      })
      setUser((prev) => (prev ? { ...prev, isAdmin: adminPending } : prev))
      setAdminPending(null)
    } finally {
      setSavingAdmin(false)
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!userId || !user?.membership) return
    setSavingStatus(true)
    try {
      await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipStatus: newStatus,
          membershipId: user.membership.id,
        }),
      })
      setUser((prev) =>
        prev?.membership
          ? {
              ...prev,
              membership: {
                ...prev.membership,
                status: newStatus as MembershipStatus,
              },
            }
          : prev,
      )
    } finally {
      setSavingStatus(false)
    }
  }

  const isOpen = Boolean(userId)

  return (
    <>
      <Drawer
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        direction="right"
      >
        <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-[480px]">
          <DrawerHeader className="">
            <DrawerTitle className="sr-only">User Details</DrawerTitle>
            <DrawerDescription className="sr-only">
              Manage user account and membership
            </DrawerDescription>
          </DrawerHeader>

          <ScrollArea className="flex-1 overflow-y-auto">
            {loading && <DrawerSkeleton />}
            {error && (
              <div className="p-6">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {user && (
              <div className="p-6 space-y-6">
                {/* Header */}
                {(() => {
                  const primary =
                    user.profile?.nickname ??
                    shortWalletAddress(user.walletAddress) ??
                    displayEmail(user.email) ??
                    user.email
                  const secondary = displayEmail(user.email)
                  const showSecondary =
                    secondary !== null && secondary !== primary
                  return (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-12">
                          {user.profile?.imageUrl && (
                            <AvatarImage
                              src={user.profile.imageUrl}
                              alt={primary}
                            />
                          )}
                          <AvatarFallback>{getInitials(user)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground">
                            {primary}
                          </p>
                          {showSecondary && (
                            <p className="text-xs text-muted-foreground">
                              {secondary}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/admin/users/${userId}/edit`)
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteOpen(true)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )
                })()}

                {/* Membership */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-1">
                    Membership
                  </h3>
                  {user.membership ? (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {user.membership.tier?.name ?? 'Unknown tier'}
                        </p>
                        <MembershipStatusBadge
                          status={user.membership.status}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground w-20 shrink-0">
                          Status
                        </label>
                        <select
                          value={user.membership.status}
                          disabled={savingStatus}
                          onChange={(e) => handleStatusChange(e.target.value)}
                          className="flex-1 text-sm rounded-md border border-border bg-background px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="pending">Pending</option>
                          <option value="active">Active</option>
                          <option value="expired">Expired</option>
                          <option value="failed">Failed</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">
                            Activated
                          </span>
                          <p>{formatDate(user.membership.activatedAt)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Expires</span>
                          <p>{formatDate(user.membership.expiresAt)}</p>
                        </div>
                      </div>
                      {user.membership.stripeSubscriptionId && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-20 shrink-0">
                            Stripe ID
                          </span>
                          <CopyField
                            value={user.membership.stripeSubscriptionId}
                            displayValue={`${user.membership.stripeSubscriptionId.slice(0, 14)}…`}
                            label="Copy Stripe subscription ID"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No membership
                    </p>
                  )}
                </section>

                {/* Learning */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-1">
                    Learning Activity
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Lessons completed
                      </p>
                      <p className="font-medium">
                        {user.learnerProfile?.totalLessonsCompleted ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Courses completed
                      </p>
                      <p className="font-medium">
                        {user.learnerProfile?.totalCoursesCompleted ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Last active
                      </p>
                      <p className="font-medium">
                        {formatRelative(
                          user.learnerProfile?.lastActiveAt ?? null,
                        )}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Account */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-1">
                    Account
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-20 shrink-0 text-xs">
                        User ID
                      </span>
                      <CopyField
                        value={user.id}
                        displayValue={`${user.id.slice(0, 12)}…`}
                        label="Copy user ID"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-20 shrink-0 text-xs">
                        Wallet
                      </span>
                      {user.walletAddress ? (
                        <CopyField
                          value={user.walletAddress}
                          displayValue={
                            shortWalletAddress(user.walletAddress) ??
                            user.walletAddress
                          }
                          label="Copy wallet address"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          None
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Admin toggle — two-click pattern to prevent accidental escalation */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-sm font-medium">Admin access</p>
                      <p className="text-xs text-muted-foreground">
                        {user.isAdmin
                          ? 'Full admin privileges'
                          : 'Regular member'}
                      </p>
                    </div>
                    {adminPending === null ? (
                      <Button
                        variant={user.isAdmin ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => setAdminPending(!user.isAdmin)}
                      >
                        {user.isAdmin ? 'Revoke admin' : 'Grant admin'}
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAdminPending(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant={adminPending ? 'default' : 'destructive'}
                          onClick={handleAdminConfirm}
                          disabled={savingAdmin}
                        >
                          {savingAdmin ? 'Saving…' : 'Confirm'}
                        </Button>
                      </div>
                    )}
                  </div>
                </section>

                {/* Communication stubs */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-1">
                    Reach out
                  </h3>
                  <div className="flex gap-2">
                    {[
                      {
                        Icon: MailIcon,
                        label: 'Email',
                        ariaLabel: 'Send email (coming soon)',
                      },
                      {
                        Icon: MessageSquareIcon,
                        label: 'Message',
                        ariaLabel: 'Send message (coming soon)',
                      },
                      {
                        Icon: PhoneIcon,
                        label: 'SMS',
                        ariaLabel: 'Send SMS (coming soon)',
                      },
                    ].map(({ Icon, label, ariaLabel }) => (
                      <Tooltip key={label}>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              aria-label={ariaLabel}
                              className="gap-1.5"
                            >
                              <Icon className="size-3.5" />
                              {label}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Coming soon</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </ScrollArea>
        </DrawerContent>
      </Drawer>

      {deleteOpen && user && (
        <UserDeleteDialog
          userId={user.id}
          userEmail={
            user.profile?.nickname ??
            shortWalletAddress(user.walletAddress) ??
            displayEmail(user.email) ??
            user.email
          }
          open={true}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
        />
      )}
    </>
  )
}
