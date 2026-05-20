'use client'

import { useState } from 'react'
import type { HeroData } from '@/types/hero'
import type { HeroFormState } from '@/types/page-index'
import { Button } from '@/ui/button'
import {
  defaultHeroFormState,
  HeroFormSection,
  heroFormStateFromSource,
  heroFormStateToPayload,
} from '@/ui/hero-form-section'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'

export interface HeroEditorProps {
  /** PATCH endpoint for the parent entity, e.g. '/api/v1/admin/courses/abc123' */
  parentEndpoint: string
  /** Existing Hero record linked to the parent, or null if none exists yet */
  initialHero: HeroData | null
  /** Called after a brand-new Hero is created and linked; receives the new hero id. */
  onHeroCreated?: (heroId: string) => void
  /** Called on every form state change — for live preview consumers. */
  onFormChange?: (form: HeroFormState) => void
  /** When true, skip the parent-link PATCH after creating a new hero (standalone hero page). */
  skipLink?: boolean
  /** Public-facing URL for the linked entity — shown as "Preview on site ↗" link. */
  previewHref?: string
}

export function HeroEditor({
  parentEndpoint,
  initialHero,
  onHeroCreated,
  onFormChange,
  skipLink,
  previewHref,
}: HeroEditorProps) {
  const [form, setForm] = useState<HeroFormState>(() =>
    initialHero ? heroFormStateFromSource(initialHero) : defaultHeroFormState(),
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateForm(next: HeroFormState) {
    setForm(next)
    onFormChange?.(next)
  }

  function handleReset() {
    const next = initialHero
      ? heroFormStateFromSource(initialHero)
      : defaultHeroFormState()
    updateForm(next)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)

    try {
      const payload = heroFormStateToPayload(form)

      if (form.id) {
        // Existing Hero record — PATCH it directly
        const res = await fetch(`/api/v1/admin/heroes/${form.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(
            (data as { message?: string }).message ?? 'Save failed',
          )
        }
      } else {
        // No Hero record yet — create one then optionally link it to the parent
        const createRes = await fetch('/api/v1/admin/heroes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!createRes.ok) {
          const data = await createRes.json().catch(() => ({}))
          throw new Error(
            (data as { message?: string }).message ?? 'Save failed',
          )
        }
        const created = (await createRes.json()) as { id: string }
        // Reason: update local state so subsequent saves use PATCH path instead of re-creating
        updateForm({ ...form, id: created.id })

        if (!skipLink) {
          // Link the new Hero to the parent entity
          const linkRes = await fetch(parentEndpoint, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ heroId: created.id }),
          })
          if (!linkRes.ok) {
            const data = await linkRes.json().catch(() => ({}))
            throw new Error(
              (data as { message?: string }).message ?? 'Link failed',
            )
          }
        }

        onHeroCreated?.(created.id)
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
    <form onSubmit={handleSave} className="space-y-6">
      {/* Hero name — used to identify this hero in the picker */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="hero-name">Hero name</Label>
        <Input
          id="hero-name"
          value={form.name}
          onChange={(e) => updateForm({ ...form, name: e.target.value })}
          placeholder="e.g. Homepage hero"
          disabled={saving}
        />
        <p className="text-xs text-muted-foreground">
          Used to identify this hero in the picker.
        </p>
      </div>

      <HeroFormSection value={form} onChange={updateForm} disabled={saving} />
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={handleReset}
          >
            Reset
          </Button>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-sm text-positive flex items-center gap-1">
              ✓ Saved
            </span>
          )}
          {previewHref && (
            <a
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            >
              Preview on site ↗
            </a>
          )}
        </div>
      </div>
    </form>
  )
}
