'use client'

import * as React from 'react'
import { useRef, useState } from 'react'
import { ImageOff } from 'lucide-react'
import type { HeroConfig } from '@/types/course'
import type { HeroData } from '@/types/hero'
import type { HeroFormState } from '@/types/page-index'
import { Button } from '@/ui/button'
import { highlightStyle } from '@/ui/hero-styles'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Switch } from '@/ui/switch'

// ── Public helpers ────────────────────────────────────────────────────────────

export function heroFormStateFromSource(src: HeroData): HeroFormState {
  const stats: Array<{ value: string; label: string }> = []
  if (src.heroStat1Value && src.heroStat1Label)
    stats.push({ value: src.heroStat1Value, label: src.heroStat1Label })
  if (src.heroStat2Value && src.heroStat2Label)
    stats.push({ value: src.heroStat2Value, label: src.heroStat2Label })
  if (src.heroStat3Value && src.heroStat3Label)
    stats.push({ value: src.heroStat3Value, label: src.heroStat3Label })
  return {
    id: src.id,
    name: src.name ?? '',
    heroEyebrow: src.heroEyebrow ?? '',
    heroTitle: src.heroTitle ?? '',
    heroTitleHighlight: src.heroTitleHighlight ?? '',
    heroDescription: src.heroDescription ?? '',
    heroCtaLabel: src.heroCtaLabel ?? '',
    heroCtaHref: src.heroCtaHref ?? '',
    heroSecondaryLabel: src.heroSecondaryLabel ?? '',
    heroSecondaryHref: src.heroSecondaryHref ?? '',
    stats,
    heroImage: src.heroImage ?? '',
    heroImageBadgeTitle: src.heroImageBadgeTitle ?? '',
    heroImageBadgeSubtitle: src.heroImageBadgeSubtitle ?? '',
    heroBackgroundImage: src.heroBackgroundImage ?? '',
    heroBackgroundImageMobile: src.heroBackgroundImageMobile ?? '',
    heroFullscreen: src.heroFullscreen ?? false,
    heroHideGrid: src.heroHideGrid ?? false,
  }
}

/** Returns a fresh, all-empty HeroFormState — used when no Hero record exists yet. */
export function defaultHeroFormState(): HeroFormState {
  return {
    id: null,
    name: '',
    heroEyebrow: '',
    heroTitle: '',
    heroTitleHighlight: '',
    heroDescription: '',
    heroCtaLabel: '',
    heroCtaHref: '',
    heroSecondaryLabel: '',
    heroSecondaryHref: '',
    stats: [],
    heroImage: '',
    heroImageBadgeTitle: '',
    heroImageBadgeSubtitle: '',
    heroBackgroundImage: '',
    heroBackgroundImageMobile: '',
    heroFullscreen: false,
    heroHideGrid: false,
  }
}

export function heroFormStateToPayload(
  state: HeroFormState,
): Record<string, unknown> {
  return {
    name: state.name || null,
    heroEyebrow: state.heroEyebrow || null,
    heroTitle: state.heroTitle || null,
    heroTitleHighlight: state.heroTitleHighlight || null,
    heroDescription: state.heroDescription || null,
    heroCtaLabel: state.heroCtaLabel || null,
    heroCtaHref: state.heroCtaHref || null,
    heroSecondaryLabel: state.heroSecondaryLabel || null,
    heroSecondaryHref: state.heroSecondaryHref || null,
    heroStat1Value: state.stats[0]?.value || null,
    heroStat1Label: state.stats[0]?.label || null,
    heroStat2Value: state.stats[1]?.value || null,
    heroStat2Label: state.stats[1]?.label || null,
    heroStat3Value: state.stats[2]?.value || null,
    heroStat3Label: state.stats[2]?.label || null,
    heroImage: state.heroImage || null,
    heroImageBadgeTitle: state.heroImageBadgeTitle || null,
    heroImageBadgeSubtitle: state.heroImageBadgeSubtitle || null,
    heroBackgroundImage: state.heroBackgroundImage || null,
    heroBackgroundImageMobile: state.heroBackgroundImageMobile || null,
    heroFullscreen: state.heroFullscreen,
    heroHideGrid: state.heroHideGrid,
  }
}

/** Converts a live HeroFormState to a HeroConfig for rendering the Hero component. */
export function buildHeroConfigFromFormState(form: HeroFormState): HeroConfig {
  return {
    eyebrow: form.heroEyebrow || undefined,
    title: form.heroTitle || undefined,
    titleHighlight: form.heroTitleHighlight || undefined,
    description: form.heroDescription || undefined,
    ctaLabel: form.heroCtaLabel || undefined,
    ctaHref: form.heroCtaHref || undefined,
    secondaryLabel: form.heroSecondaryLabel || undefined,
    secondaryHref: form.heroSecondaryHref || undefined,
    stats: form.stats.filter((s) => s.value && s.label),
    image: form.heroImage || undefined,
    imageBadgeTitle: form.heroImageBadgeTitle || undefined,
    imageBadgeSubtitle: form.heroImageBadgeSubtitle || undefined,
    backgroundImage: form.heroBackgroundImage || undefined,
    backgroundImageMobile: form.heroBackgroundImageMobile || undefined,
    fullscreen: form.heroFullscreen || undefined,
    hideGrid: form.heroHideGrid || undefined,
  }
}

// ── Sub-component ─────────────────────────────────────────────────────────────

interface HeroStatsRepeaterProps {
  stats: Array<{ value: string; label: string }>
  onChange: (next: Array<{ value: string; label: string }>) => void
  disabled?: boolean
}

function HeroStatsRepeater({
  stats,
  onChange,
  disabled,
}: HeroStatsRepeaterProps) {
  function handleStatChange(
    index: number,
    field: 'value' | 'label',
    text: string,
  ) {
    const next = stats.map((s, i) =>
      i === index ? { ...s, [field]: text } : s,
    )
    onChange(next)
  }

  function handleRemove(index: number) {
    onChange(stats.filter((_, i) => i !== index))
  }

  function handleAdd() {
    onChange([...stats, { value: '', label: '' }])
  }

  return (
    <fieldset className="flex flex-col gap-4 border border-border rounded-md p-4">
      <div className="flex items-center justify-between">
        <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
          Stats
        </legend>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {stats.length}/3
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {stats.map((stat, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              aria-label={`Stat ${i + 1} value`}
              value={stat.value}
              onChange={(e) => handleStatChange(i, 'value', e.target.value)}
              placeholder="Value"
              disabled={disabled}
            />
            <Input
              aria-label={`Stat ${i + 1} label`}
              value={stat.label}
              onChange={(e) => handleStatChange(i, 'label', e.target.value)}
              placeholder="Label"
              disabled={disabled}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleRemove(i)}
              disabled={disabled}
              aria-label={`Remove stat ${i + 1}`}
            >
              Remove
            </Button>
          </div>
        ))}
        {stats.length < 3 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={disabled}
            className="self-start"
          >
            Add Stat
          </Button>
        )}
      </div>
      {stats.some((s) => s.value || s.label) && (
        <p className="text-xs text-muted-foreground">
          {stats
            .filter((s) => s.value || s.label)
            .map((s) => `${s.value} ${s.label}`.trim())
            .join(' | ')}
        </p>
      )}
    </fieldset>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface HeroFormSectionProps {
  value: HeroFormState
  onChange: (next: HeroFormState) => void
  disabled?: boolean
}

function UrlInputWithThumb({
  id,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  const [thumbSrc, setThumbSrc] = useState(value || '')
  const [thumbError, setThumbError] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    onChange(v)
    setThumbError(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setThumbSrc(v), 400)
  }

  return (
    <div className="flex items-start gap-3">
      <Input
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1"
      />
      {thumbSrc && (
        <div className="w-10 h-10 rounded shrink-0 overflow-hidden border border-border bg-muted flex items-center justify-center">
          {thumbError ? (
            <ImageOff className="size-4 text-muted-foreground" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbSrc}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setThumbError(true)}
              onLoad={() => setThumbError(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}

export function HeroFormSection({
  value,
  onChange,
  disabled,
}: HeroFormSectionProps) {
  function set<K extends keyof HeroFormState>(key: K, val: HeroFormState[K]) {
    onChange({ ...value, [key]: val })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Visual */}
      <fieldset className="flex flex-col gap-4 border border-border rounded-md p-4">
        <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
          Visual
        </legend>

        {/* Background sub-group */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-muted-foreground">
            Background
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hero-bg-image">Background Image (desktop)</Label>
            <UrlInputWithThumb
              id="hero-bg-image"
              value={value.heroBackgroundImage}
              onChange={(v) => set('heroBackgroundImage', v)}
              placeholder="https://... or /images/hero-bg-desktop.png"
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Full-bleed background. Overrides the gradient when set.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hero-bg-image-mobile">
              Background Image (mobile)
            </Label>
            <UrlInputWithThumb
              id="hero-bg-image-mobile"
              value={value.heroBackgroundImageMobile}
              onChange={(v) => set('heroBackgroundImageMobile', v)}
              placeholder="Optional — falls back to desktop image on small screens"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Side image sub-group */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-muted-foreground">
            Side Image
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hero-image">Image URL</Label>
            <UrlInputWithThumb
              id="hero-image"
              value={value.heroImage}
              onChange={(v) => set('heroImage', v)}
              placeholder="/images/og-image.png"
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hero-image-badge-title">Badge Title</Label>
            <Input
              id="hero-image-badge-title"
              value={value.heroImageBadgeTitle}
              onChange={(e) => set('heroImageBadgeTitle', e.target.value)}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Appears as a floating label overlay on the side image.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hero-image-badge-subtitle">Badge Subtitle</Label>
            <Input
              id="hero-image-badge-subtitle"
              value={value.heroImageBadgeSubtitle}
              onChange={(e) => set('heroImageBadgeSubtitle', e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </fieldset>

      {/* Content */}
      <fieldset className="flex flex-col gap-4 border border-border rounded-md p-4">
        <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
          Content
        </legend>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hero-eyebrow">Eyebrow</Label>
          <Input
            id="hero-eyebrow"
            value={value.heroEyebrow}
            onChange={(e) => set('heroEyebrow', e.target.value)}
            maxLength={80}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Small label above the title — e.g. &apos;New course&apos; or
            &apos;Featured&apos;
          </p>
          <p className="text-xs text-muted-foreground text-right">
            {value.heroEyebrow.length} / 80
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hero-title">Title</Label>
          <Input
            id="hero-title"
            value={value.heroTitle}
            onChange={(e) => set('heroTitle', e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hero-title-highlight">Title Highlight</Label>
          <Input
            id="hero-title-highlight"
            value={value.heroTitleHighlight}
            onChange={(e) => set('heroTitleHighlight', e.target.value)}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            One word or phrase from your title that receives the gradient
            treatment. Must match the title text exactly.
          </p>
          {value.heroTitleHighlight && (
            <div className="rounded-md bg-muted/40 px-3 py-1.5 text-sm">
              Preview:{' '}
              <span style={highlightStyle}>{value.heroTitleHighlight}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hero-description">Description</Label>
          <textarea
            id="hero-description"
            value={value.heroDescription}
            onChange={(e) => set('heroDescription', e.target.value)}
            maxLength={200}
            disabled={disabled}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 min-h-[80px] resize-y"
          />
          <p className="text-xs text-muted-foreground text-right">
            {value.heroDescription.length} / 200
          </p>
        </div>
      </fieldset>

      {/* Call to Action */}
      <fieldset className="flex flex-col gap-4 border border-border rounded-md p-4">
        <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
          Call to Action
        </legend>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hero-cta-label">Button Label</Label>
          <Input
            id="hero-cta-label"
            value={value.heroCtaLabel}
            onChange={(e) => set('heroCtaLabel', e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hero-cta-href">Button Link</Label>
          <Input
            id="hero-cta-href"
            value={value.heroCtaHref}
            onChange={(e) => set('heroCtaHref', e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hero-secondary-label">Secondary Label</Label>
          <Input
            id="hero-secondary-label"
            value={value.heroSecondaryLabel}
            onChange={(e) => set('heroSecondaryLabel', e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hero-secondary-href">Secondary Link</Label>
          <Input
            id="hero-secondary-href"
            value={value.heroSecondaryHref}
            onChange={(e) => set('heroSecondaryHref', e.target.value)}
            disabled={disabled}
          />
        </div>
      </fieldset>

      {/* Stats */}
      <HeroStatsRepeater
        stats={value.stats}
        onChange={(stats) => set('stats', stats)}
        disabled={disabled}
      />

      {/* Advanced */}
      <fieldset className="flex flex-col gap-4 border border-border rounded-md p-4">
        <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
          Advanced
        </legend>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="hero-fullscreen">Fullscreen mode</Label>
            <p className="text-xs text-muted-foreground">
              Stretches the hero to fill the viewport height. Recommended with a
              strong background image.
            </p>
          </div>
          <Switch
            id="hero-fullscreen"
            checked={value.heroFullscreen}
            onCheckedChange={(checked) => set('heroFullscreen', checked)}
            disabled={disabled}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="hero-hide-grid">Hide grid overlay</Label>
            <p className="text-xs text-muted-foreground">
              Removes the subtle dot-grid texture from the hero background.
            </p>
          </div>
          <Switch
            id="hero-hide-grid"
            checked={value.heroHideGrid}
            onCheckedChange={(checked) => set('heroHideGrid', checked)}
            disabled={disabled}
          />
        </div>
      </fieldset>
    </div>
  )
}
