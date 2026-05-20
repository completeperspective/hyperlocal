'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import type { UserDetail } from '@/types/users-admin'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'

interface UserEditFormProps {
  user: UserDetail
}

// ============================================================================
// Section: Account
// ============================================================================

function AccountSection({ user }: { user: UserDetail }) {
  const router = useRouter()
  const [name, setName] = useState(user.name ?? '')
  const [email, setEmail] = useState(user.email)
  const [mobile, setMobile] = useState(user.mobile ?? '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsPending(true)
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, mobile }),
      })
      const body = (await res.json().catch(() => ({}))) as { message?: string }
      if (!res.ok) {
        setError(body.message ?? 'Something went wrong')
        return
      }
      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 4000)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-6 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Account
      </h2>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-name">Name</Label>
          <Input
            id="edit-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-email">Email</Label>
          <Input
            id="edit-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-mobile">Mobile</Label>
          <Input
            id="edit-mobile"
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="+1 555 000 0000"
          />
        </div>
        {error && (
          <div
            role="alert"
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        )}
        {success && (
          <div
            role="status"
            className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400"
          >
            Changes saved.
          </div>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </section>
  )
}

// ============================================================================
// Section: Profile
// ============================================================================

function ProfileSection({ user }: { user: UserDetail }) {
  const router = useRouter()
  const [nickname, setNickname] = useState(user.profile?.nickname ?? '')
  const [description, setDescription] = useState(
    user.profile?.description ?? '',
  )
  const [location, setLocation] = useState(user.profile?.location ?? '')
  const [isPublic, setIsPublic] = useState(user.profile?.isPublic ?? false)
  const [contactPreference, setContactPreference] = useState(
    user.profile?.contactPreference ?? 'email',
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsPending(true)
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: {
            nickname,
            description,
            location,
            isPublic,
            contactPreference,
          },
        }),
      })
      const body = (await res.json().catch(() => ({}))) as { message?: string }
      if (!res.ok) {
        setError(body.message ?? 'Something went wrong')
        return
      }
      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 4000)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-6 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Profile
      </h2>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-nickname">Nickname</Label>
          <Input
            id="edit-nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Display name"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-bio">Bio</Label>
          <textarea
            id="edit-bio"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short bio"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring resize-none disabled:opacity-50"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-location">Location</Label>
          <Input
            id="edit-location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, Country"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="edit-is-public"
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <Label
            htmlFor="edit-is-public"
            className="font-normal cursor-pointer"
          >
            Show in members directory
          </Label>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-contact-preference">Preferred contact</Label>
          <select
            id="edit-contact-preference"
            value={contactPreference}
            onChange={(e) => setContactPreference(e.target.value)}
            className="flex rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="both">Both</option>
            <option value="none">None</option>
          </select>
        </div>
        {error && (
          <div
            role="alert"
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        )}
        {success && (
          <div
            role="status"
            className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400"
          >
            Changes saved.
          </div>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      </form>
    </section>
  )
}

// ============================================================================
// Section: Set Password
// ============================================================================

function SetPasswordSection({ user }: { user: UserDetail }) {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const tooShort = newPassword.length > 0 && newPassword.length < 8
  const mismatch = confirmPassword.length > 0 && confirmPassword !== newPassword

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (tooShort || mismatch) return
    setError(null)
    setSuccess(false)
    setIsPending(true)
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })
      const body = (await res.json().catch(() => ({}))) as { message?: string }
      if (!res.ok) {
        setError(body.message ?? 'Something went wrong')
        return
      }
      setNewPassword('')
      setConfirmPassword('')
      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 4000)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-6 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Set Password
      </h2>
      <div className="rounded-md bg-muted/40 border border-border px-3 py-2.5">
        <p className="text-xs text-muted-foreground">
          Setting a new password will not notify the user.
        </p>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="admin-new-password">New Password</Label>
          <div className="relative">
            <Input
              id="admin-new-password"
              type={showNew ? 'text' : 'password'}
              className="pr-10"
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              aria-label={showNew ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              onClick={() => setShowNew((v) => !v)}
            >
              {showNew ? (
                <EyeOffIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="admin-confirm-password">Confirm Password</Label>
          <div className="relative">
            <Input
              id="admin-confirm-password"
              type={showConfirm ? 'text' : 'password'}
              className="pr-10"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              onClick={() => setShowConfirm((v) => !v)}
            >
              {showConfirm ? (
                <EyeOffIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
            </button>
          </div>
          {mismatch && (
            <p role="alert" className="text-xs text-destructive">
              Passwords do not match
            </p>
          )}
        </div>
        {error && (
          <div
            role="alert"
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        )}
        {success && (
          <div
            role="status"
            className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400"
          >
            Changes saved.
          </div>
        )}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={
              isPending ||
              mismatch ||
              tooShort ||
              !newPassword ||
              !confirmPassword
            }
          >
            {isPending ? 'Setting…' : 'Set password'}
          </Button>
        </div>
      </form>
    </section>
  )
}

// ============================================================================
// Section: Admin Access
// ============================================================================

function AdminAccessSection({ user }: { user: UserDetail }) {
  const router = useRouter()
  const [adminPending, setAdminPending] = useState<boolean | null>(null)
  const [savingAdmin, setSavingAdmin] = useState(false)

  async function handleAdminConfirm() {
    if (adminPending === null) return
    setSavingAdmin(true)
    try {
      await fetch(`/api/v1/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: adminPending }),
      })
      setAdminPending(null)
      router.refresh()
    } finally {
      setSavingAdmin(false)
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-6 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Admin Access
      </h2>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">
              Admin privileges
            </p>
            <Badge variant={user.isAdmin ? 'default' : 'secondary'}>
              {user.isAdmin ? 'Admin' : 'Member'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {user.isAdmin
              ? 'Has full admin access to all content and settings.'
              : 'Standard member with no admin access.'}
          </p>
        </div>

        {adminPending === null && (
          <Button
            variant={user.isAdmin ? 'destructive' : 'outline'}
            size="sm"
            className="shrink-0"
            onClick={() => setAdminPending(!user.isAdmin)}
          >
            {user.isAdmin ? 'Revoke admin' : 'Grant admin'}
          </Button>
        )}

        {adminPending !== null && (
          <div className="flex gap-2 shrink-0">
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
              disabled={savingAdmin}
              onClick={handleAdminConfirm}
            >
              {savingAdmin ? 'Saving…' : 'Confirm'}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

// ============================================================================
// Main: UserEditForm
// ============================================================================

export function UserEditForm({ user }: UserEditFormProps) {
  return (
    <div className="space-y-6">
      <AccountSection user={user} />
      <ProfileSection user={user} />
      <SetPasswordSection user={user} />
      <AdminAccessSection user={user} />
    </div>
  )
}
