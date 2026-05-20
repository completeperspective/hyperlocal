'use client'

import { useEffect, useState } from 'react'
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

interface PageCreateDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

type Status = 'draft' | 'private' | 'membership' | 'published'

interface FormState {
  title: string
  slug: string
  status: Status
}

const defaultForm: FormState = {
  title: '',
  slug: '',
  status: 'draft',
}

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function PageCreateDialog({
  open,
  onClose,
  onSuccess,
}: PageCreateDialogProps) {
  const [form, setForm] = useState<FormState>(defaultForm)
  const [slugTouched, setSlugTouched] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setForm(defaultForm)
    setSlugTouched(false)
    setError(null)
  }, [open])

  function handleTitleChange(title: string) {
    setForm((prev) => ({
      ...prev,
      title,
      slug: slugTouched ? prev.slug : toSlug(title),
    }))
  }

  function handleSlugChange(slug: string) {
    setSlugTouched(true)
    setForm((prev) => ({
      ...prev,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
    }))
  }

  const slugError =
    form.slug && !/^[a-z0-9-]+$/.test(form.slug)
      ? 'Slug must be lowercase letters, numbers, and hyphens only'
      : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (slugError) return
    setIsPending(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug,
          status: form.status,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(
          (data as { message?: string }).message ?? 'Something went wrong.',
        )
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
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
          <DialogTitle>New Page</DialogTitle>
          <DialogDescription>Create a new standalone page.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="page-title">Title</Label>
            <Input
              id="page-title"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              placeholder="e.g. About Us"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="page-slug">Slug</Label>
            <Input
              id="page-slug"
              value={form.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              required
              placeholder="e.g. about-us"
              className="font-mono text-sm"
              aria-invalid={!!slugError || undefined}
            />
            {slugError && (
              <p className="text-xs text-destructive">{slugError}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="page-status">Status</Label>
            <select
              id="page-status"
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status: e.target.value as Status,
                }))
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="draft">Draft</option>
              <option value="private">Private</option>
              <option value="membership">Membership</option>
              <option value="published">Published</option>
            </select>
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !!slugError}>
              {isPending ? 'Creating…' : 'Create Page'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
