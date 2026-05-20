import {
  autoContrast,
  clampHue,
  formatOklch,
  harmonyHues,
  type HarmonyMode,
} from './color-theory'

export interface ThemeGeneratorOptions {
  primaryL: number
  primaryC: number
  primaryH: number
  harmonyMode: HarmonyMode
  saturationBias: number
  lightnessBias: number
}

export interface GeneratedTheme {
  lightMode: Record<string, string>
  darkMode: Record<string, string>
}

export const LIVE_TOKENS = [
  'primary',
  'primaryForeground',
  'secondary',
  'secondaryForeground',
  'accent',
  'accentForeground',
  'sidebar',
  'sidebarPrimary',
  'sidebarPrimaryForeground',
  'sidebarAccent',
  'sidebarBorder',
] as const

export const PENDING_TOKENS = [
  'background',
  'foreground',
  'card',
  'cardForeground',
  'popover',
  'popoverForeground',
  'muted',
  'mutedForeground',
  'border',
  'input',
  'ring',
  'sidebarForeground',
  'sidebarAccentForeground',
  'sidebarRing',
  'destructive',
  'destructiveForeground',
  'info',
  'infoForeground',
  'warning',
  'warningForeground',
  'positive',
  'positiveForeground',
  'meta1',
  'meta2',
  'meta3',
  'meta4',
  'meta5',
] as const

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function generateLiveTokens(
  opts: ThemeGeneratorOptions,
): Record<string, string> {
  const { primaryL, primaryC, primaryH, harmonyMode } = opts
  const { h2, h3 } = harmonyHues(primaryH, harmonyMode)

  const primary = formatOklch(primaryL, primaryC, primaryH)
  const primaryForeground = autoContrast(primary)

  const secC = harmonyMode === 'monochromatic' ? primaryC * 0.5 : primaryC * 0.7
  const secH = harmonyMode === 'monochromatic' ? primaryH : h2
  const secL =
    harmonyMode === 'monochromatic' ? Math.max(0.3, primaryL - 0.15) : 0.45
  const secondary = formatOklch(secL, secC, secH)
  const secondaryForeground = autoContrast(secondary)

  const accC = harmonyMode === 'monochromatic' ? primaryC * 0.3 : primaryC * 0.5
  const accH = harmonyMode === 'monochromatic' ? primaryH : h3
  const accent = formatOklch(0.74, accC, accH)
  const accentForeground = autoContrast(accent)

  return {
    primary,
    primaryForeground,
    secondary,
    secondaryForeground,
    accent,
    accentForeground,
    // Sidebar tokens that are either identical to primary or trivially hue-tinted
    sidebar: formatOklch(0.985, 0.002, primaryH),
    sidebarPrimary: primary,
    sidebarPrimaryForeground: primaryForeground,
    sidebarAccent: formatOklch(0.94, 0.005, primaryH),
    sidebarBorder: formatOklch(0.92, 0.003, primaryH),
  }
}

export function generateFullTheme(opts: ThemeGeneratorOptions): GeneratedTheme {
  const {
    primaryL,
    primaryC,
    primaryH,
    saturationBias: sb,
    lightnessBias: lb,
  } = opts
  const { h2, h3 } = harmonyHues(primaryH, opts.harmonyMode)
  const live = generateLiveTokens(opts)

  // ── Light mode ──────────────────────────────────────────────────────
  const background = formatOklch(
    clamp(0.97 + lb * 0.15, 0.85, 0.99),
    0.003,
    primaryH,
  )
  const foreground = formatOklch(
    clamp(0.18 - lb * 0.05, 0.1, 0.25),
    0.005,
    primaryH,
  )

  const card = formatOklch(1.0, 0, 0)
  const cardForeground = foreground
  const popover = formatOklch(1.0, 0, 0)
  const popoverForeground = foreground

  const muted = formatOklch(0.97, 0, 0)
  const mutedForeground = formatOklch(0.55, 0, 0)

  const border = formatOklch(0.92, 0.003, primaryH)
  const input = formatOklch(0.92, 0, 0)
  const ring = formatOklch(0.71, 0, 0)

  const sidebar = formatOklch(0.985, 0.002, primaryH)
  const sidebarForeground = foreground
  const sidebarPrimary = live.primary
  const sidebarPrimaryForeground = live.primaryForeground
  const sidebarAccent = formatOklch(0.94, 0.005, primaryH)
  const sidebarAccentForeground = foreground
  const sidebarBorder = border
  const sidebarRing = ring

  const hShift = clamp((primaryH - 180) * 0.05, -15, 15)
  const destructive = formatOklch(
    0.55,
    clamp(0.24 + sb * 0.05, 0.18, 0.3),
    clampHue(27 + hShift),
  )
  const destructiveForeground = autoContrast(destructive)
  const warning = formatOklch(
    0.75,
    clamp(0.18 + sb * 0.03, 0.13, 0.22),
    clampHue(55 + hShift * 0.5),
  )
  const warningForeground = autoContrast(warning)
  const positive = formatOklch(
    0.68,
    clamp(0.18 + sb * 0.03, 0.13, 0.22),
    clampHue(142 + hShift * 0.3),
  )
  const positiveForeground = autoContrast(positive)
  const info = formatOklch(
    0.7,
    clamp(0.15 + sb * 0.03, 0.1, 0.2),
    clampHue(240 + hShift * 0.2),
  )
  const infoForeground = autoContrast(info)

  const metaHues = [0, 1, 2, 3, 4].map((i) => clampHue(primaryH + i * 72))
  const meta1 = formatOklch(
    0.65,
    clamp(primaryC * 0.85 + sb * 0.05, 0.1, 0.3),
    metaHues[0],
  )
  const meta2 = formatOklch(
    0.62,
    clamp(primaryC * 0.7 + sb * 0.05, 0.08, 0.25),
    metaHues[1],
  )
  const meta3 = formatOklch(
    0.68,
    clamp(primaryC * 0.75 + sb * 0.05, 0.08, 0.25),
    metaHues[2],
  )
  const meta4 = formatOklch(
    0.64,
    clamp(primaryC * 0.8 + sb * 0.05, 0.1, 0.28),
    metaHues[3],
  )
  const meta5 = formatOklch(
    0.7,
    clamp(primaryC * 0.65 + sb * 0.05, 0.08, 0.22),
    metaHues[4],
  )

  const lightMode: Record<string, string> = {
    ...live,
    background,
    foreground,
    card,
    cardForeground,
    popover,
    popoverForeground,
    muted,
    mutedForeground,
    border,
    input,
    ring,
    sidebar,
    sidebarForeground,
    sidebarPrimary,
    sidebarPrimaryForeground,
    sidebarAccent,
    sidebarAccentForeground,
    sidebarBorder,
    sidebarRing,
    destructive,
    destructiveForeground,
    info,
    infoForeground,
    warning,
    warningForeground,
    positive,
    positiveForeground,
    meta1,
    meta2,
    meta3,
    meta4,
    meta5,
  }

  // ── Dark mode ────────────────────────────────────────────────────────
  const bg_d = formatOklch(clamp(0.18 - lb * 0.05, 0.12, 0.22), 0.005, primaryH)
  const fg_d = formatOklch(
    clamp(0.965 + lb * 0.02, 0.92, 0.99),
    0.003,
    primaryH,
  )
  const card_d = formatOklch(0.24, 0.004, primaryH)
  const muted_d = formatOklch(0.24, 0.004, primaryH)
  const sidebar_d = formatOklch(0.24, 0.004, primaryH)

  const darkPrimaryL =
    primaryL < 0.45 ? Math.min(primaryL + 0.15, 0.72) : primaryL
  const primary_d = formatOklch(darkPrimaryL, primaryC, primaryH)
  const primaryFg_d = autoContrast(primary_d)

  const secC_d =
    opts.harmonyMode === 'monochromatic' ? primaryC * 0.5 : primaryC * 0.7
  const secH_d = opts.harmonyMode === 'monochromatic' ? primaryH : h2
  const secL_d =
    opts.harmonyMode === 'monochromatic'
      ? Math.min(0.65, (primaryL < 0.45 ? primaryL + 0.15 : primaryL) + 0.1)
      : 0.6
  const secondary_d = formatOklch(secL_d, secC_d, secH_d)
  const secondaryFg_d = autoContrast(secondary_d)

  const accC_d =
    opts.harmonyMode === 'monochromatic' ? primaryC * 0.3 : primaryC * 0.5
  const accH_d = opts.harmonyMode === 'monochromatic' ? primaryH : h3
  const accent_d = formatOklch(0.65, accC_d, accH_d)
  const accentFg_d = autoContrast(accent_d)

  const destructive_d = formatOklch(
    0.6,
    clamp(0.24 + sb * 0.05, 0.18, 0.3),
    clampHue(27 + hShift),
  )
  const destructiveFg_d = autoContrast(destructive_d)
  const warning_d = formatOklch(
    0.72,
    clamp(0.18 + sb * 0.03, 0.13, 0.22),
    clampHue(55 + hShift * 0.5),
  )
  const warningFg_d = autoContrast(warning_d)
  const positive_d = formatOklch(
    0.65,
    clamp(0.18 + sb * 0.03, 0.13, 0.22),
    clampHue(142 + hShift * 0.3),
  )
  const positiveFg_d = autoContrast(positive_d)
  const info_d = formatOklch(
    0.67,
    clamp(0.15 + sb * 0.03, 0.1, 0.2),
    clampHue(240 + hShift * 0.2),
  )
  const infoFg_d = autoContrast(info_d)

  const meta1_d = formatOklch(
    0.7,
    clamp(primaryC * 0.85 + sb * 0.05, 0.1, 0.3),
    metaHues[0],
  )
  const meta2_d = formatOklch(
    0.67,
    clamp(primaryC * 0.7 + sb * 0.05, 0.08, 0.25),
    metaHues[1],
  )
  const meta3_d = formatOklch(
    0.72,
    clamp(primaryC * 0.75 + sb * 0.05, 0.08, 0.25),
    metaHues[2],
  )
  const meta4_d = formatOklch(
    0.69,
    clamp(primaryC * 0.8 + sb * 0.05, 0.1, 0.28),
    metaHues[3],
  )
  const meta5_d = formatOklch(
    0.74,
    clamp(primaryC * 0.65 + sb * 0.05, 0.08, 0.22),
    metaHues[4],
  )

  const darkMode: Record<string, string> = {
    primary: primary_d,
    primaryForeground: primaryFg_d,
    secondary: secondary_d,
    secondaryForeground: secondaryFg_d,
    accent: accent_d,
    accentForeground: accentFg_d,
    background: bg_d,
    foreground: fg_d,
    card: card_d,
    cardForeground: fg_d,
    popover: card_d,
    popoverForeground: fg_d,
    muted: muted_d,
    mutedForeground: formatOklch(0.65, 0.005, primaryH),
    border: 'oklch(1 0 0 / 10%)',
    input: 'oklch(1 0 0 / 15%)',
    ring: formatOklch(0.71, 0, 0),
    sidebar: sidebar_d,
    sidebarForeground: fg_d,
    sidebarPrimary: primary_d,
    sidebarPrimaryForeground: primaryFg_d,
    sidebarAccent: formatOklch(0.28, 0.008, primaryH),
    sidebarAccentForeground: fg_d,
    sidebarBorder: 'oklch(1 0 0 / 10%)',
    sidebarRing: formatOklch(0.71, 0, 0),
    destructive: destructive_d,
    destructiveForeground: destructiveFg_d,
    info: info_d,
    infoForeground: infoFg_d,
    warning: warning_d,
    warningForeground: warningFg_d,
    positive: positive_d,
    positiveForeground: positiveFg_d,
    meta1: meta1_d,
    meta2: meta2_d,
    meta3: meta3_d,
    meta4: meta4_d,
    meta5: meta5_d,
  }

  return { lightMode, darkMode }
}
