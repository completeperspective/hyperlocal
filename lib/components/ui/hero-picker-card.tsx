'use client'

import { Check } from 'lucide-react'
import type { HeroSummary } from '@/types/hero'
import { buildGlowStyle } from '@/ui/hero-styles'

interface HeroPickerCardProps {
  hero: HeroSummary
  selected: boolean
  onSelect: () => void
}

export function HeroPickerCard({
  hero,
  selected,
  onSelect,
}: HeroPickerCardProps) {
  const name = hero.name ?? hero.heroTitle ?? hero.heroEyebrow

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      className={[
        'rounded-lg border bg-card cursor-pointer transition-colors overflow-hidden',
        selected
          ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-accent/30',
      ].join(' ')}
    >
      {/* Gradient swatch */}
      <div
        className="w-full h-16 relative overflow-hidden"
        style={{ background: 'var(--hero-surface)' }}
      >
        <div style={buildGlowStyle()} />
        {hero.heroBackgroundImage && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero.heroBackgroundImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
          </>
        )}
        {selected && (
          <div className="absolute top-2 right-2 size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center z-10">
            <Check className="size-2.5" />
          </div>
        )}
      </div>
      {/* Body */}
      <div className="px-3 py-2">
        {name ? (
          <p className="text-xs font-semibold truncate">{name}</p>
        ) : (
          <p className="text-xs font-semibold truncate italic text-muted-foreground">
            Untitled Hero
          </p>
        )}
        {hero.heroEyebrow && name !== hero.heroEyebrow && (
          <p className="text-[10px] text-muted-foreground truncate">
            {hero.heroEyebrow}
          </p>
        )}
        {hero.heroTitle && name !== hero.heroTitle && (
          <p className="text-xs text-foreground/70 truncate">
            {hero.heroTitle}
          </p>
        )}
      </div>
    </div>
  )
}
