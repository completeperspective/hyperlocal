'use client'

import { useState } from 'react'
import type { PageData } from '@/types/page'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'

interface SeoPanelProps {
  pageId: string
  initialData: Pick<PageData, 'metaTitle' | 'metaDescription' | 'ogImage'>
}

interface SeoForm {
  metaTitle: string
  metaDescription: string
  ogImageId: string
}

export function SeoPanel({ pageId, initialData }: SeoPanelProps) {
  const [form, setForm] = useState<SeoForm>({
    metaTitle: initialData.metaTitle ?? '',
    metaDescription: initialData.metaDescription ?? '',
    ogImageId: initialData.ogImage?.id ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ogImagePreviewUrl, setOgImagePreviewUrl] = useState<string | null>(
    initialData.ogImage?.source?.publicUrl ?? null,
  )
  const [ogUploadPending, setOgUploadPending] = useState(false)
  const [ogUploadError, setOgUploadError] = useState<string | null>(null)

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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch(`/api/v1/admin/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metaTitle: form.metaTitle || null,
          metaDescription: form.metaDescription || null,
          ogImageId: form.ogImageId || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { message?: string }).message ?? 'Save failed')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="seo-meta-title">Meta Title</Label>
        <Input
          id="seo-meta-title"
          value={form.metaTitle}
          onChange={(e) =>
            setForm((p) => ({ ...p, metaTitle: e.target.value }))
          }
          placeholder="Overrides the page title in search results"
          maxLength={120}
        />
        <p className="text-xs text-muted-foreground">
          {form.metaTitle.length}/120 characters
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="seo-meta-desc">Meta Description</Label>
        <textarea
          id="seo-meta-desc"
          value={form.metaDescription}
          onChange={(e) =>
            setForm((p) => ({ ...p, metaDescription: e.target.value }))
          }
          placeholder="Brief summary shown in search results (150–160 characters recommended)"
          maxLength={300}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none"
        />
        <p className="text-xs text-muted-foreground">
          {form.metaDescription.length}/300 characters
        </p>
      </div>

      {/* OG Image */}
      <div className="flex flex-col gap-3">
        <Label>OG Image</Label>

        {ogImagePreviewUrl && (
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-md border border-border"
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

        {!ogImagePreviewUrl && form.ogImageId && (
          <p className="text-xs text-muted-foreground font-mono">
            Image set (ID: {form.ogImageId}) — replace below to preview
          </p>
        )}

        <div className="flex items-center gap-3">
          <Label
            htmlFor="seoOgImageUpload"
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {ogUploadPending
              ? 'Uploading…'
              : ogImagePreviewUrl || form.ogImageId
                ? 'Replace Image'
                : 'Upload Image'}
            <input
              id="seoOgImageUpload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
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
          <p className="text-sm text-destructive">{ogUploadError}</p>
        )}

        <p className="text-xs text-muted-foreground">
          Recommended: 1200×630px. Max 5 MB. JPEG, PNG, WebP, or GIF.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save SEO'}
        </Button>
        {saved && <span className="text-sm text-green-600">Saved</span>}
      </div>
    </form>
  )
}
