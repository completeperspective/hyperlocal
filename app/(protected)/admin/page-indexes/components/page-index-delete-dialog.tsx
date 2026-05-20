'use client'

import { useState } from 'react'
import type { PageIndexListItem } from '@/types/page-index'
import { Button } from '@/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'

interface PageIndexDeleteDialogProps {
  open: boolean
  item: PageIndexListItem | null
  onClose: () => void
  onSuccess: () => void
}

export function PageIndexDeleteDialog({
  open,
  item,
  onClose,
  onSuccess,
}: PageIndexDeleteDialogProps) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    if (!item) return
    setIsPending(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/admin/page-indexes/${item.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(
          (data as { message?: string }).message ?? 'Delete failed.',
        )
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setIsPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !isPending) onClose()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete page index</DialogTitle>
          <DialogDescription>
            This will permanently delete{' '}
            <strong>{item?.title ?? 'this page index'}</strong>. Pages and
            groups inside it will not be deleted but will become unreachable.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? 'Deleting…' : 'Delete index'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
