'use client'

import { useState } from 'react'
import type { TierRow } from '@/types/membership-tiers-admin'
import { Button } from '@/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'

interface TierDeleteDialogProps {
  tier: TierRow | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function TierDeleteDialog({
  tier,
  open,
  onClose,
  onSuccess,
}: TierDeleteDialogProps) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasMembers = (tier?.memberCount ?? 0) > 0
  const hasContentRules = (tier?.contentAccessPatterns?.length ?? 0) > 0

  async function handleConfirm() {
    if (!tier) return
    setIsPending(true)
    setError(null)

    try {
      const res = await fetch(`/api/v1/admin/membership-tiers/${tier.id}`, {
        method: 'DELETE',
      })

      if (res.status === 204) {
        onSuccess()
        onClose()
        return
      }

      const data = await res.json().catch(() => ({}))
      const msg = (data as { message?: string }).message

      if (res.status === 409) {
        const count = (data as { memberCount?: number }).memberCount
        setError(
          `This tier has ${count ?? tier.memberCount} active member(s) and cannot be deleted.`,
        )
      } else if (res.status === 502) {
        setError(msg ?? 'Stripe cleanup failed. Tier not deleted.')
      } else {
        setError(msg ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsPending(false)
    }
  }

  function handleOpenChange(o: boolean) {
    if (!o && !isPending) {
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {tier?.name ?? 'Tier'}</DialogTitle>
          {hasMembers ? (
            <DialogDescription>
              This tier has <strong>{tier?.memberCount}</strong> active
              member(s) and cannot be deleted. Reassign or expire all members
              first.
            </DialogDescription>
          ) : (
            <DialogDescription>
              This action cannot be undone.
              {tier?.stripeProductId && (
                <> The associated Stripe product and price will be archived.</>
              )}
              {hasContentRules && (
                <>
                  {' '}
                  Deleting this tier will also remove{' '}
                  {tier!.contentAccessPatterns!.length} content access rule
                  {tier!.contentAccessPatterns!.length !== 1 ? 's' : ''}.
                </>
              )}
            </DialogDescription>
          )}
        </DialogHeader>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter>
          {hasMembers ? (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={isPending}
              >
                {isPending ? 'Deleting…' : 'Delete tier'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
