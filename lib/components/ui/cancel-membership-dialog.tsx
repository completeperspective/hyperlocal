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

interface CancelMembershipDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tierName: string
  onConfirm: () => Promise<void>
}

export function CancelMembershipDialog({
  open,
  onOpenChange,
  tierName,
  onConfirm,
}: CancelMembershipDialogProps) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setError(null)
    setIsPending(true)
    try {
      await onConfirm()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.',
      )
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !isPending) onOpenChange(false)
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel membership</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel your{' '}
            <strong>{tierName || 'current'}</strong> membership?
          </DialogDescription>
        </DialogHeader>

        <div
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          <strong>Warning:</strong> You will immediately lose access to all
          content in this tier. This cannot be undone.
        </div>

        {error && (
          <p
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Keep membership
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            aria-busy={isPending}
            onClick={handleConfirm}
          >
            {isPending ? 'Cancelling…' : 'Cancel membership'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
