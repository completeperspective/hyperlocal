'use client'

import { useEffect, useState } from 'react'
import type { HeroFormState } from '@/types/page-index'
import { buildGlowStyle, gridStyle, highlightStyle } from '@/ui/hero-styles'

interface HeroPreviewCardProps {
  value: HeroFormState
}

export function HeroPreviewCard({ value }: HeroPreviewCardProps) {
  // 150ms debounce so rapid typing doesn't flicker
  const [displayed, setDisplayed] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDisplayed(value), 150)
    return () => clearTimeout(t)
  }, [value])

  const hasContent = Boolean(displayed.heroTitle)

  const titleParts = () => {
    const { heroTitle, heroTitleHighlight } = displayed
    if (!heroTitleHighlight || !heroTitle.includes(heroTitleHighlight)) {
      return <>{heroTitle}</>
    }
    const idx = heroTitle.indexOf(heroTitleHighlight)
    return (
      <>
        {heroTitle.slice(0, idx)}
        <span style={highlightStyle}>{heroTitleHighlight}</span>
        {heroTitle.slice(idx + heroTitleHighlight.length)}
      </>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className="w-80 aspect-video rounded-lg overflow-hidden relative"
        data-forced-theme="dark"
        style={{ background: 'var(--hero-surface)' }}
      >
        {/* Glow overlays */}
        <div aria-hidden="true" style={buildGlowStyle()} />
        {/* Grid overlay */}
        <div aria-hidden="true" style={gridStyle} />

        {/* Background image */}
        {displayed.heroBackgroundImage && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayed.heroBackgroundImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ zIndex: 0 }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.55)', zIndex: 1 }}
            />
          </>
        )}

        {!hasContent ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <p className="text-[10px] text-white/40">Add a title to preview</p>
          </div>
        ) : (
          <div className="absolute inset-0 z-10 flex gap-2 p-3">
            {/* Content column */}
            <div className="flex flex-1 flex-col gap-1.5 overflow-hidden">
              {displayed.heroEyebrow && (
                <div className="inline-flex self-start items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] text-white/80">
                  {displayed.heroEyebrow}
                </div>
              )}
              <h3 className="text-sm font-bold leading-tight text-white line-clamp-2">
                {titleParts()}
              </h3>
              {displayed.heroDescription && (
                <p className="text-[10px] text-white/70 line-clamp-1">
                  {displayed.heroDescription}
                </p>
              )}
              {displayed.heroCtaLabel && (
                <div
                  className="self-start rounded px-2 py-0.5 font-semibold text-white"
                  style={{ background: 'var(--primary)', fontSize: '9px' }}
                >
                  {displayed.heroCtaLabel}
                </div>
              )}
              {displayed.stats.some((s) => s.value) && (
                <div className="flex gap-3 mt-auto pt-1 border-t border-white/10">
                  {displayed.stats
                    .filter((s) => s.value)
                    .map((s, i) => (
                      <div key={i} className="flex flex-col">
                        <span className="text-[10px] font-bold text-white">
                          {s.value}
                        </span>
                        <span className="text-[8px] text-white/50">
                          {s.label}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
            {/* Right column — image or placeholder */}
            <div className="w-[30%] shrink-0 rounded-lg bg-white/5 border border-white/10 overflow-hidden">
              {displayed.heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayed.heroImage}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center mt-2">
        Live preview — not to scale
      </p>
    </div>
  )
}
