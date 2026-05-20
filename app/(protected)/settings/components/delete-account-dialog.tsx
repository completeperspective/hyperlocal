'use client'

import { useState } from 'react'
import { Button } from '@/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleDelete() {
    setError(null)
    setIsPending(true)

    try {
      const res = await fetch('/api/v1/account/me', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string
        }
        if (res.status === 401) {
          setError('Incorrect password')
        } else {
          setError(body.message ?? 'Something went wrong. Please try again.')
        }
        return
      }

      // Reason: use window.location.href not router.push() after account deletion
      // so the session cookie is fully cleared on iOS WebKit (router.push has timing issues).
      window.location.href = '/'
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <section className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-destructive">
          Danger Zone
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Delete my account
            </p>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
          </div>
          <Button
            variant="destructive"
            className="shrink-0"
            onClick={() => setOpen(true)}
          >
            Delete my account
          </Button>
        </div>
      </section>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o && !isPending) setOpen(false)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete your account</DialogTitle>
            <DialogDescription>
              This will permanently delete your account and all associated data.
              To confirm, enter your current password below.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="delete-confirm-password">Current Password</Label>
            <Input
              id="delete-confirm-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password to confirm"
            />
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending || !password}
              onClick={handleDelete}
            >
              {isPending ? 'Deleting…' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
