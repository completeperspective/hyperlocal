import type * as React from 'react'
import type { HeroPalette } from '@/types/course'

// Reason: shared between hero.tsx, hero-preview-card.tsx, hero-picker-card.tsx,
// and hero-form-section.tsx — extracted to avoid duplication.

export const highlightStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

export function buildGlowStyle(palette?: HeroPalette): React.CSSProperties {
  const p = palette?.primary ?? 'var(--primary)'
  const s = palette?.secondary ?? 'var(--accent)'
  const a = palette?.accent ?? 'var(--secondary)'
  const [pi, si, ai] = palette ? ['22%', '18%', '10%'] : ['18%', '14%', '7%']
  return {
    position: 'absolute',
    inset: 0,
    zIndex: 2,
    background: `
      radial-gradient(ellipse 70% 60% at 60% 110%, color-mix(in oklch, ${p} ${pi}, transparent) 0%, transparent 70%),
      radial-gradient(ellipse 50% 40% at 90% 20%, color-mix(in oklch, ${s} ${si}, transparent) 0%, transparent 65%),
      radial-gradient(ellipse 40% 30% at 10% 80%, color-mix(in oklch, ${a} ${ai}, transparent) 0%, transparent 60%)
    `,
    pointerEvents: 'none',
  }
}

export const gridStyle: React.CSSProperties = {
  zIndex: 3,
  position: 'absolute',
  inset: 0,
  backgroundImage: `
    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
  `,
  backgroundSize: '48px 48px',
  pointerEvents: 'none',
}
