'use client'

import { useEffect, useState } from 'react'
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
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { UrlPreviewBar } from './url-preview-bar'

interface PageIndexFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  item?: PageIndexListItem
  onClose: () => void
  onSuccess: () => void
}

interface FormState {
  title: string
  slug: string
  basePath: string
  status: 'draft' | 'private' | 'membership' | 'published'
  groupsLabel: string
  metaTitle: string
  metaDescription: string
  ogImageId: string
}

const defaultForm: FormState = {
  title: '',
  slug: '',
  basePath: '',
  status: 'draft',
  groupsLabel: '',
  metaTitle: '',
  metaDescription: '',
  ogImageId: '',
}

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function PageIndexFormDialog({
  open,
  mode,
  item,
  onClose,
  onSuccess,
}: PageIndexFormDialogProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'seo'>('general')
  const [form, setForm] = useState<FormState>(defaultForm)
  const [slugTouched, setSlugTouched] = useState(false)
  const [pathValid, setPathValid] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingSeo, setIsLoadingSeo] = useState(false)
  const [ogImagePreviewUrl, setOgImagePreviewUrl] = useState<string | null>(
    null,
  )
  const [ogUploadPending, setOgUploadPending] = useState(false)
  const [ogUploadError, setOgUploadError] = useState<string | null>(null)

  // Reset and (for edit mode) load full SEO data when the dialog opens
  useEffect(() => {
    if (!open) return

    setActiveTab('general')
    setOgUploadError(null)

    if (mode === 'edit' && item) {
      setForm({
        title: item.title,
        slug: item.slug,
        basePath: item.basePath,
        status: item.status as FormState['status'],
        groupsLabel: item.groupsLabel ?? '',
        metaTitle: '',
        metaDescription: '',
        ogImageId: '',
      })
      setSlugTouched(true)
      setOgImagePreviewUrl(null)

      // Fetch the full record to populate SEO fields
      setIsLoadingSeo(true)
      fetch(`/api/v1/admin/page-indexes/${item.id}`)
        .then((res) => res.json())
        .then((data) => {
          setForm((prev) => ({
            ...prev,
            groupsLabel: data.groupsLabel ?? '',
            metaTitle: data.metaTitle ?? '',
            metaDescription: data.metaDescription ?? '',
            ogImageId: data.ogImage?.id ?? '',
          }))
          setOgImagePreviewUrl(data.ogImage?.source?.publicUrl ?? null)
        })
        .catch(() => {
          // Non-fatal: form still usable with base fields
        })
        .finally(() => {
          setIsLoadingSeo(false)
        })
    } else {
      setForm(defaultForm)
      setSlugTouched(false)
      setOgImagePreviewUrl(null)
    }

    setError(null)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

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

  async function handleOgImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setOgUploadPending(true)
    setOgUploadError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/v1/admin/og-image', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Upload failed' }))
        throw new Error(
          (err as { message?: string }).message ?? 'Upload failed',
        )
      }
      const data = (await res.json()) as { id: string; url: string }
      setForm((prev) => ({ ...prev, ogImageId: data.id }))
      setOgImagePreviewUrl(data.url)
    } catch (err) {
      setOgUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setOgUploadPending(false)
      e.target.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pathValid) return
    setIsPending(true)
    setError(null)

    const url =
      mode === 'create'
        ? '/api/v1/admin/page-indexes'
        : `/api/v1/admin/page-indexes/${item!.id}`
    const method = mode === 'create' ? 'POST' : 'PATCH'

    // Build the payload. For create, omit groupsLabel if empty.
    const payload: Record<string, unknown> = {
      title: form.title,
      slug: form.slug,
      basePath: form.basePath,
      status: form.status,
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      ogImageId: form.ogImageId || null,
    }

    if (mode === 'create') {
      if (form.groupsLabel) payload.groupsLabel = form.groupsLabel
    } else {
      payload.groupsLabel = form.groupsLabel
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const slugError =
    form.slug && !/^[a-z0-9-]+$/.test(form.slug)
      ? 'Slug must be lowercase letters, numbers, and hyphens only'
      : null

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !isPending) onClose()
      }}
    >
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'New Page Index' : 'Edit Page Index'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a new page index at a custom URL path.'
              : 'Update the page index details and URL path.'}
          </DialogDescription>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex border-b border-border -mx-0 mb-2">
          {(['general', 'seo'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* ── General Tab ── */}
          {activeTab === 'general' && (
            <>
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pi-title">Title</Label>
                <Input
                  id="pi-title"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                  placeholder="e.g. Developer Docs"
                />
              </div>

              {/* Slug */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pi-slug">Slug</Label>
                <Input
                  id="pi-slug"
                  value={form.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  required
                  placeholder="e.g. developer-docs"
                  className="font-mono text-sm"
                  aria-invalid={!!slugError || undefined}
                />
                {slugError && (
                  <p className="text-xs text-destructive">{slugError}</p>
                )}
              </div>

              {/* Base Path */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pi-basepath">
                  Base Path{' '}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="pi-basepath"
                  value={form.basePath}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      basePath: e.target.value
                        .toLowerCase()
                        .replace(/^\//, '')
                        .replace(/\/$/, ''),
                    }))
                  }
                  placeholder="e.g. docs/v2"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Multi-level prefix without leading slash. Leave empty to
                  publish at{' '}
                  <code className="font-mono">/{form.slug || 'slug'}</code>.
                </p>
              </div>

              {/* URL Preview */}
              <UrlPreviewBar
                basePath={form.basePath}
                slug={form.slug}
                excludeId={mode === 'edit' ? item?.id : undefined}
                onValidationChange={setPathValid}
              />

              {/* Status */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pi-status">Status</Label>
                <select
                  id="pi-status"
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status: e.target.value as FormState['status'],
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

              {/* Groups Label */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pi-groups-label">Groups Label</Label>
                <Input
                  id="pi-groups-label"
                  value={form.groupsLabel}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      groupsLabel: e.target.value,
                    }))
                  }
                  placeholder="e.g. Chapters, Sections"
                />
                <p className="text-xs text-muted-foreground">
                  Plural label for page groups in the TOC (e.g. Chapters,
                  Sections). Defaults to &lsquo;Groups&rsquo;.
                </p>
              </div>
            </>
          )}

          {/* ── SEO Tab ── */}
          {activeTab === 'seo' && (
            <>
              {isLoadingSeo ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Loading&hellip;
                </p>
              ) : (
                <>
                  {/* Meta Title */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="pi-meta-title">Meta Title</Label>
                    <Input
                      id="pi-meta-title"
                      value={form.metaTitle}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          metaTitle: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Meta Description */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="pi-meta-description">
                      Meta Description
                    </Label>
                    <Input
                      id="pi-meta-description"
                      value={form.metaDescription}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          metaDescription: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* OG Image */}
                  <div className="flex flex-col gap-3">
                    <Label>OG Image</Label>

                    {ogImagePreviewUrl && (
                      <div
                        className="relative w-full overflow-hidden rounded-md border border-border"
                        style={{ aspectRatio: '1200/630' }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ogImagePreviewUrl}
                          alt="OG image preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}

                    {/* Show a text indicator when there's an existing image but no preview URL */}
                    {!ogImagePreviewUrl && form.ogImageId && (
                      <p className="text-xs text-muted-foreground">
                        An OG image is set. Upload a new file below to replace
                        it.
                      </p>
                    )}

                    <div className="flex items-center gap-3">
                      <Label
                        htmlFor="pi-og-image-upload"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        {ogUploadPending
                          ? 'Uploading…'
                          : form.ogImageId
                            ? 'Replace Image'
                            : 'Upload Image'}
                        <input
                          id="pi-og-image-upload"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          onChange={handleOgImageUpload}
                          disabled={ogUploadPending}
                        />
                      </Label>

                      {form.ogImageId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setForm((prev) => ({ ...prev, ogImageId: '' }))
                            setOgImagePreviewUrl(null)
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    {ogUploadError && (
                      <p className="text-sm text-destructive">
                        {ogUploadError}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Recommended: 1200x630px. JPEG, PNG, WebP.
                    </p>
                  </div>
                </>
              )}
            </>
          )}

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
            <Button
              type="submit"
              disabled={isPending || !pathValid || !!slugError}
            >
              {isPending
                ? mode === 'create'
                  ? 'Creating…'
                  : 'Saving…'
                : mode === 'create'
                  ? 'Create Index'
                  : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
