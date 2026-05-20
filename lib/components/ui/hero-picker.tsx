'use client'

import { useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import type { HeroData, HeroSummary } from '@/types/hero'
import type { HeroFormState } from '@/types/page-index'
import { Button } from '@/ui/button'
import { HeroEditor } from '@/ui/hero-editor'
import { heroFormStateFromSource } from '@/ui/hero-form-section'
import { HeroPickerCard } from '@/ui/hero-picker-card'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Separator } from '@/ui/separator'

export interface HeroPickerProps {
  /** PATCH endpoint for the parent entity, e.g. '/api/v1/admin/courses/abc' */
  parentEndpoint: string
  /** Current hero linked to this entity, or null */
  initialHero: HeroData | null
  /** Whether the hero is currently enabled on the parent entity */
  initialHeroEnabled: boolean
  /** Public-facing URL for the linked entity — shown as "Preview on site ↗" link. */
  previewHref?: string
  /** Called whenever the live form state changes — for external preview consumers. */
  onFormChange?: (form: HeroFormState | null) => void
  /** Called when heroEnabled is toggled (after successful PATCH). */
  onHeroEnabledChange?: (enabled: boolean) => void
}

type PickerMode = 'pick' | 'create' | 'editing'

export function HeroPicker({
  parentEndpoint,
  initialHero,
  initialHeroEnabled,
  previewHref,
  onFormChange,
  onHeroEnabledChange,
}: HeroPickerProps) {
  const [heroEnabled, setHeroEnabled] = useState(initialHeroEnabled)
  const [linkedHero, setLinkedHero] = useState<HeroData | null>(initialHero)
  const [mode, setMode] = useState<PickerMode>(initialHero ? 'editing' : 'pick')

  // Live form state for HeroPreviewCard (lifted from HeroEditor via onFormChange)
  const [liveForm, setLiveForm] = useState<HeroFormState | null>(() =>
    initialHero ? heroFormStateFromSource(initialHero) : null,
  )

  function updateLiveForm(form: HeroFormState | null) {
    setLiveForm(form)
    onFormChange?.(form)
  }

  // Hero list for the picker grid
  const [heroList, setHeroList] = useState<HeroSummary[]>([])
  const [heroListLoaded, setHeroListLoaded] = useState(false)
  const [heroListLoading, setHeroListLoading] = useState(false)

  // Per-action saving state
  const [togglingEnabled, setTogglingEnabled] = useState(false)
  const [linkingHero, setLinkingHero] = useState(false)
  const [unlinking, setUnlinking] = useState(false)

  const [selectedHeroId, setSelectedHeroId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const filteredHeroList = heroList.filter((h) => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      h.name?.toLowerCase().includes(q) ||
      h.heroTitle?.toLowerCase().includes(q) ||
      h.heroEyebrow?.toLowerCase().includes(q)
    )
  })

  // Fetch the hero list lazily when the picker section opens
  async function ensureHeroList() {
    if (heroListLoaded || heroListLoading) return
    setHeroListLoading(true)
    setActionError(null)
    try {
      const res = await fetch('/api/v1/admin/heroes')
      if (!res.ok) throw new Error('Failed to load heroes')
      const data = (await res.json()) as { heroes: HeroSummary[] }
      setHeroList(data.heroes)
      setHeroListLoaded(true)
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to load heroes',
      )
    } finally {
      setHeroListLoading(false)
    }
  }

  async function handleToggleEnabled(checked: boolean) {
    setTogglingEnabled(true)
    setActionError(null)
    try {
      const res = await fetch(parentEndpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heroEnabled: checked }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(
          (data as { message?: string }).message ?? 'Failed to update',
        )
      }
      setHeroEnabled(checked)
      onHeroEnabledChange?.(checked)
      // Reason: lazily load hero list when the section is first opened
      if (checked && !linkedHero) {
        await ensureHeroList()
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setTogglingEnabled(false)
    }
  }

  async function handleSelectHero() {
    if (!selectedHeroId) return
    setLinkingHero(true)
    setActionError(null)
    try {
      const res = await fetch(parentEndpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heroId: selectedHeroId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(
          (data as { message?: string }).message ?? 'Failed to link hero',
        )
      }
      // Fetch the full hero data to populate the editor
      const heroRes = await fetch(`/api/v1/admin/heroes/${selectedHeroId}`)
      if (heroRes.ok) {
        const heroData = (await heroRes.json()) as HeroData
        setLinkedHero(heroData)
      }
      setMode('editing')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to link hero')
    } finally {
      setLinkingHero(false)
    }
  }

  async function handleUnlink() {
    setUnlinking(true)
    setActionError(null)
    try {
      const res = await fetch(parentEndpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heroId: null }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(
          (data as { message?: string }).message ?? 'Failed to unlink hero',
        )
      }
      setLinkedHero(null)
      updateLiveForm(null)
      setSelectedHeroId('')
      setMode('pick')
      // Reload hero list for next selection
      setHeroListLoaded(false)
      await ensureHeroList()
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to unlink hero',
      )
    } finally {
      setUnlinking(false)
    }
  }

  function handleShowCreate() {
    setMode('create')
  }

  function handleHeroCreated(heroId: string) {
    // After creating, switch to editing mode; linkedHero will be populated on next load
    // Reason: we set a minimal placeholder so the editor re-uses PATCH path on future saves
    setLinkedHero({ id: heroId } as HeroData)
    setMode('editing')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Enable toggle */}
      <div className="flex items-center gap-2">
        <input
          id="hero-enabled-toggle"
          type="checkbox"
          checked={heroEnabled}
          onChange={(e) => handleToggleEnabled(e.target.checked)}
          disabled={togglingEnabled}
          className="h-4 w-4 rounded border-input accent-primary"
        />
        <Label htmlFor="hero-enabled-toggle">Show hero on this page</Label>
        {togglingEnabled && (
          <span className="text-xs text-muted-foreground">Saving…</span>
        )}
      </div>

      {actionError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      )}

      {/* Hero content — only visible when enabled */}
      {heroEnabled && (
        <div className="flex flex-col gap-4 border border-border rounded-md p-4">
          {mode === 'editing' && linkedHero && (
            <HeroEditor
              parentEndpoint={parentEndpoint}
              initialHero={linkedHero}
              onHeroCreated={handleHeroCreated}
              onFormChange={updateLiveForm}
              previewHref={previewHref}
            />
          )}

          {mode === 'pick' && (
            <div className="flex flex-col gap-4">
              {heroListLoading && (
                <p className="text-sm text-muted-foreground">Loading heroes…</p>
              )}

              {heroListLoaded && heroList.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <Sparkles className="size-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">No heroes yet</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Create a hero to add a marketing banner to this content.
                    </p>
                  </div>
                  <Button type="button" onClick={handleShowCreate}>
                    Create your first hero
                  </Button>
                </div>
              )}

              {heroListLoaded && heroList.length > 0 && (
                <>
                  <Input
                    placeholder="Search heroes…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredHeroList.map((h) => (
                      <HeroPickerCard
                        key={h.id}
                        hero={h}
                        selected={selectedHeroId === h.id}
                        onSelect={() => setSelectedHeroId(h.id)}
                      />
                    ))}
                    {/* Create new card */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={handleShowCreate}
                      onKeyDown={(e) => e.key === 'Enter' && handleShowCreate()}
                      className="rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 min-h-[100px] hover:border-primary/50 hover:bg-accent/20 cursor-pointer transition-colors"
                    >
                      <Plus className="size-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Create new hero
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleSelectHero}
                    disabled={!selectedHeroId || linkingHero}
                  >
                    {linkingHero ? 'Linking…' : 'Link selected hero'}
                  </Button>
                </>
              )}

              {!heroListLoaded && !heroListLoading && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleShowCreate}
                >
                  Create new hero
                </Button>
              )}
            </div>
          )}

          {mode === 'create' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Create a new hero</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode('pick')}
                >
                  Cancel
                </Button>
              </div>
              <HeroEditor
                parentEndpoint={parentEndpoint}
                initialHero={null}
                onHeroCreated={handleHeroCreated}
                onFormChange={updateLiveForm}
                previewHref={previewHref}
              />
            </div>
          )}
        </div>
      )}

      {mode === 'editing' && linkedHero && heroEnabled && (
        <>
          <Separator />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Removing the link does not delete the hero record.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUnlink}
              disabled={unlinking}
            >
              {unlinking ? 'Unlinking…' : 'Unlink hero'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
