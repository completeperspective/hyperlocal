'use client'

import { useEffect, useState } from 'react'
import type { CourseData } from '@/types/course'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { ThemeSelector, type ThemeSummary } from '@/ui/theme-selector'

interface SettingsPanelProps {
  courseId: string
  initialData: Pick<CourseData, 'title' | 'slug' | 'description' | 'status'>
  themes: ThemeSummary[]
  initialThemeId: string | null
  onThemeChange?: (id: string | null) => void
}

type Status = 'draft' | 'private' | 'membership' | 'published'

interface SettingsForm {
  title: string
  slug: string
  description: string
  status: Status
  themeId: string | null
}

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function SettingsPanel({
  courseId,
  initialData,
  themes,
  initialThemeId,
  onThemeChange,
}: SettingsPanelProps) {
  const [form, setForm] = useState<SettingsForm>({
    title: initialData.title,
    slug: initialData.slug,
    description: initialData.description ?? '',
    status: initialData.status as Status,
    themeId: initialThemeId,
  })
  const [slugTouched, setSlugTouched] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setForm({
      title: initialData.title,
      slug: initialData.slug,
      description: initialData.description ?? '',
      status: initialData.status as Status,
      themeId: initialThemeId,
    })
  }, [
    initialData.title,
    initialData.slug,
    initialData.description,
    initialData.status,
    initialThemeId,
  ])

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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!!slugError) return
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch(`/api/v1/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug,
          description: form.description,
          status: form.status,
          themeId: form.themeId,
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
        <Label htmlFor="s-title">Title</Label>
        <Input
          id="s-title"
          value={form.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          required
          placeholder="e.g. Introduction to TypeScript"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="s-slug">Slug</Label>
        <Input
          id="s-slug"
          value={form.slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          required
          placeholder="e.g. intro-to-typescript"
          className="font-mono text-sm"
          aria-invalid={!!slugError || undefined}
        />
        {slugError && <p className="text-xs text-destructive">{slugError}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="s-description">Description</Label>
        <textarea
          id="s-description"
          value={form.description}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Brief description of this course"
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="s-status">Status</Label>
        <select
          id="s-status"
          value={form.status}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, status: e.target.value as Status }))
          }
          className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="draft">Draft</option>
          <option value="private">Private</option>
          <option value="membership">Membership</option>
          <option value="published">Published</option>
        </select>
      </div>

      <ThemeSelector
        themes={themes}
        value={form.themeId}
        onChange={(themeId) => {
          setForm((prev) => ({ ...prev, themeId }))
          onThemeChange?.(themeId)
        }}
        entityId={courseId}
      />

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving || !!slugError}>
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
        {saved && <span className="text-sm text-green-600">Saved</span>}
      </div>
    </form>
  )
}
