'use client'

import {
  formatOklch,
  harmonyHues,
  type HarmonyMode,
} from '@/utils/color-theory'

interface HarmonyCardsProps {
  selected: HarmonyMode
  primaryH: number
  primaryL: number
  primaryC: number
  onChange: (mode: HarmonyMode) => void
}

const MODES: { mode: HarmonyMode; label: string }[] = [
  { mode: 'monochromatic', label: 'Mono' },
  { mode: 'analogous', label: 'Analogous' },
  { mode: 'complementary', label: 'Comp.' },
  { mode: 'split-complementary', label: 'Split' },
  { mode: 'triadic', label: 'Triadic' },
  { mode: 'tetradic', label: 'Tetradic' },
]

function getHarmonyDots(
  mode: HarmonyMode,
  primaryH: number,
  primaryL: number,
  primaryC: number,
): { color: string; size: number }[] {
  const { h2, h3, h4 } = harmonyHues(primaryH, mode)
  const c = primaryC * 0.8
  const l = primaryL

  switch (mode) {
    case 'monochromatic':
      return [
        { color: formatOklch(l, primaryC, primaryH), size: 14 },
        { color: formatOklch(l - 0.1, c * 0.7, primaryH), size: 10 },
        { color: formatOklch(l + 0.1, c * 0.5, primaryH), size: 8 },
      ]
    case 'analogous':
      return [
        { color: formatOklch(l, primaryC, primaryH), size: 12 },
        { color: formatOklch(l, c, h2), size: 10 },
        { color: formatOklch(l, c, h3), size: 10 },
      ]
    case 'complementary':
      return [
        { color: formatOklch(l, primaryC, primaryH), size: 12 },
        { color: formatOklch(l, c, h2), size: 12 },
      ]
    case 'split-complementary':
      return [
        { color: formatOklch(l, primaryC, primaryH), size: 12 },
        { color: formatOklch(l, c, h2), size: 10 },
        { color: formatOklch(l, c, h3), size: 10 },
      ]
    case 'triadic':
      return [
        { color: formatOklch(l, primaryC, primaryH), size: 10 },
        { color: formatOklch(l, c, h2), size: 10 },
        { color: formatOklch(l, c, h3), size: 10 },
      ]
    case 'tetradic':
      return [
        { color: formatOklch(l, primaryC, primaryH), size: 9 },
        { color: formatOklch(l, c, h2), size: 9 },
        { color: formatOklch(l, c, h3), size: 9 },
        { color: formatOklch(l, c, h4), size: 9 },
      ]
  }
}

export function HarmonyCards({
  selected,
  primaryH,
  primaryL,
  primaryC,
  onChange,
}: HarmonyCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {MODES.map(({ mode, label }) => {
        const isActive = selected === mode
        const dots = getHarmonyDots(mode, primaryH, primaryL, primaryC)
        return (
          <button
            key={mode}
            onClick={() => onChange(mode)}
            className={[
              'flex flex-col items-center gap-2 p-2 rounded-lg border text-left transition-all cursor-pointer',
              isActive
                ? 'border-[--forge-accent] bg-[--forge-accent]/20 ring-1 ring-[--forge-accent]/40'
                : 'border-border bg-[--forge-panel-alt] hover:border-[--forge-accent]/50',
            ].join(' ')}
          >
            <div className="flex items-center justify-center gap-1 h-6">
              {dots.map((dot, i) => (
                <div
                  key={i}
                  className="rounded-full shrink-0"
                  style={{
                    width: dot.size,
                    height: dot.size,
                    background: dot.color,
                  }}
                />
              ))}
            </div>
            <span
              className={`text-[10px] uppercase tracking-widest ${isActive ? 'font-semibold text-[--forge-text]' : 'font-normal text-[--forge-text-muted]'}`}
            >
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
