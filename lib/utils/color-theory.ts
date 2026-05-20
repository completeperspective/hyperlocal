import { converter, formatHex, parse, oklch as toOklchColor } from 'culori'

export type HarmonyMode =
  | 'monochromatic'
  | 'analogous'
  | 'complementary'
  | 'split-complementary'
  | 'triadic'
  | 'tetradic'

export type WcagLevel = 'AAA' | 'AA' | 'AA_LARGE' | 'FAIL'

export interface HarmonyHues {
  h1: number
  h2: number
  h3: number
  h4: number
}

export const CONTRAST_PAIRS: readonly [string, string][] = [
  ['background', 'foreground'],
  ['card', 'cardForeground'],
  ['popover', 'popoverForeground'],
  ['primary', 'primaryForeground'],
  ['secondary', 'secondaryForeground'],
  ['accent', 'accentForeground'],
  ['muted', 'mutedForeground'],
  ['info', 'infoForeground'],
  ['warning', 'warningForeground'],
  ['positive', 'positiveForeground'],
  ['destructive', 'destructiveForeground'],
  ['sidebar', 'sidebarForeground'],
  ['sidebarPrimary', 'sidebarPrimaryForeground'],
  ['sidebarAccent', 'sidebarAccentForeground'],
] as const

export function clampHue(h: number): number {
  return ((h % 360) + 360) % 360
}

export function formatOklch(l: number, c: number, h: number): string {
  return `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(2)})`
}

const toRgb = converter('rgb')

function linearize(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function wcagRelativeLuminance(oklchStr: string): number {
  try {
    const parsed = parse(oklchStr)
    if (!parsed) return 0
    const rgb = toRgb(parsed)
    if (!rgb) return 0
    const r = linearize(Math.max(0, Math.min(1, rgb.r ?? 0)))
    const g = linearize(Math.max(0, Math.min(1, rgb.g ?? 0)))
    const b = linearize(Math.max(0, Math.min(1, rgb.b ?? 0)))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  } catch {
    return 0
  }
}

export function wcagContrastRatio(bg: string, fg: string): number {
  const l1 = wcagRelativeLuminance(bg)
  const l2 = wcagRelativeLuminance(fg)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function wcagLevel(ratio: number): WcagLevel {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA_LARGE'
  return 'FAIL'
}

export function autoContrast(bgOklch: string): string {
  try {
    const parsed = parse(bgOklch)
    const h = parsed && 'h' in parsed ? (parsed.h ?? 0) : 0
    const white = formatOklch(0.97, 0.002, h)
    const black = formatOklch(0.15, 0.005, h)
    const whiteRatio = wcagContrastRatio(bgOklch, white)
    const blackRatio = wcagContrastRatio(bgOklch, black)
    return whiteRatio >= blackRatio ? white : black
  } catch {
    return formatOklch(0.97, 0.002, 0)
  }
}

export function isOutOfGamut(oklchStr: string): boolean {
  try {
    const parsed = parse(oklchStr)
    if (!parsed) return true
    const hex = formatHex(parsed)
    return hex === undefined
  } catch {
    return true
  }
}

export function oklchToHex(oklchStr: string): string | null {
  try {
    const parsed = parse(oklchStr)
    if (!parsed) return null
    if (typeof parsed.alpha === 'number' && parsed.alpha < 1) return null
    return formatHex(parsed) ?? null
  } catch {
    return null
  }
}

export function hexToOklch(hex: string): string {
  try {
    const parsed = parse(hex)
    if (!parsed) return hex
    const color = toOklchColor(parsed)
    if (!color) return hex
    const { l = 0, c = 0, h } = color
    return `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${(h ?? 0).toFixed(2)})`
  } catch {
    return hex
  }
}

export function harmonyHues(primaryH: number, mode: HarmonyMode): HarmonyHues {
  const h1 = primaryH
  switch (mode) {
    case 'monochromatic':
      return { h1, h2: h1, h3: h1, h4: h1 }
    case 'analogous':
      return { h1, h2: clampHue(h1 + 30), h3: clampHue(h1 - 30), h4: h1 }
    case 'complementary':
      return { h1, h2: clampHue(h1 + 180), h3: clampHue(h1 + 30), h4: h1 }
    case 'split-complementary':
      return { h1, h2: clampHue(h1 + 150), h3: clampHue(h1 + 210), h4: h1 }
    case 'triadic':
      return { h1, h2: clampHue(h1 + 120), h3: clampHue(h1 + 240), h4: h1 }
    case 'tetradic':
      return {
        h1,
        h2: clampHue(h1 + 90),
        h3: clampHue(h1 + 180),
        h4: clampHue(h1 + 270),
      }
    default:
      // Reason: guard against stale/invalid DB values — fall back to complementary
      return { h1, h2: clampHue(h1 + 180), h3: clampHue(h1 + 30), h4: h1 }
  }
}

const MOODS = [
  { min: 0, max: 15, emoji: '🔥', label: 'Fiery' },
  { min: 15, max: 45, emoji: '🌅', label: 'Warm' },
  { min: 45, max: 75, emoji: '✨', label: 'Golden' },
  { min: 75, max: 145, emoji: '🌿', label: 'Natural' },
  { min: 145, max: 195, emoji: '🌊', label: 'Serene' },
  { min: 195, max: 245, emoji: '💎', label: 'Clear' },
  { min: 245, max: 285, emoji: '🌌', label: 'Electric' },
  { min: 285, max: 345, emoji: '🪄', label: 'Vivid' },
  { min: 345, max: 360, emoji: '🔥', label: 'Fiery' },
]

export function hueMoodLabel(hue: number): { emoji: string; label: string } {
  const h = ((hue % 360) + 360) % 360
  return (
    MOODS.find((m) => h >= m.min && h < m.max) ?? {
      emoji: '🎨',
      label: 'Custom',
    }
  )
}

const HUE_SEEDS: [number, number, string[]][] = [
  [0, 30, ['Crimson', 'Scarlet', 'Ruby']],
  [30, 60, ['Amber', 'Tangerine', 'Ember']],
  [60, 90, ['Golden', 'Honey', 'Solar']],
  [90, 150, ['Forest', 'Sage', 'Emerald']],
  [150, 210, ['Teal', 'Seafoam', 'Jade']],
  [210, 270, ['Ocean', 'Cobalt', 'Azure']],
  [270, 315, ['Violet', 'Amethyst', 'Indigo']],
  [315, 360, ['Rose', 'Magenta', 'Berry']],
]
const STYLES = ['Dark', 'Deep', 'Soft', 'Bold', 'Muted', 'Vivid']

export function generateNameSuggestions(hue: number): string[] {
  const h = ((hue % 360) + 360) % 360
  const entry =
    HUE_SEEDS.find(([min, max]) => h >= min && h < max) ?? HUE_SEEDS[0]
  const [, , seeds] = entry
  return STYLES.slice(0, 3).map((style) => `${seeds[0]} ${style}`)
}
