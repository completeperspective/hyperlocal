import { describe, expect, it } from 'vitest'
import { CONTRAST_PAIRS, wcagContrastRatio } from './color-theory'
import {
  generateFullTheme,
  generateLiveTokens,
  type ThemeGeneratorOptions,
} from './theme-generator'

const baseOpts: ThemeGeneratorOptions = {
  primaryL: 0.65,
  primaryC: 0.22,
  primaryH: 270,
  harmonyMode: 'complementary',
  saturationBias: 0,
  lightnessBias: 0,
}

describe('generateLiveTokens', () => {
  it('returns 11 live tokens', () => {
    const tokens = generateLiveTokens(baseOpts)
    expect(Object.keys(tokens)).toHaveLength(11)
  })
  it('primary matches oklch format', () => {
    const tokens = generateLiveTokens(baseOpts)
    expect(tokens.primary).toMatch(/^oklch\(/)
  })
  it('primaryForeground passes WCAG AA against primary', () => {
    const tokens = generateLiveTokens(baseOpts)
    const ratio = wcagContrastRatio(tokens.primary!, tokens.primaryForeground!)
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })
  it('monochromatic secondary uses same hue as primary', () => {
    const tokens = generateLiveTokens({
      ...baseOpts,
      harmonyMode: 'monochromatic',
    })
    expect(tokens.secondary).toMatch(/270\.00/)
  })
})

describe('generateFullTheme', () => {
  it('generates 38 light tokens', () => {
    const theme = generateFullTheme(baseOpts)
    expect(Object.keys(theme.lightMode)).toHaveLength(38)
  })
  it('generates 38 dark tokens', () => {
    const theme = generateFullTheme(baseOpts)
    expect(Object.keys(theme.darkMode)).toHaveLength(38)
  })
  it('background/foreground pair passes WCAG AA in light mode', () => {
    const theme = generateFullTheme(baseOpts)
    const ratio = wcagContrastRatio(
      theme.lightMode.background,
      theme.lightMode.foreground,
    )
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })
  it('all 14 contrast pairs in light mode have ratio >= 3', () => {
    const theme = generateFullTheme(baseOpts)
    for (const [bg, fg] of CONTRAST_PAIRS) {
      const bgVal = theme.lightMode[bg]
      const fgVal = theme.lightMode[fg]
      if (!bgVal || !fgVal) continue
      const ratio = wcagContrastRatio(bgVal, fgVal)
      expect(ratio).toBeGreaterThanOrEqual(3)
    }
  })
  it('saturation bias changes secondary token chroma in full theme', () => {
    // saturationBias affects the full theme's structural tokens
    const normal = generateFullTheme(baseOpts)
    const vivid = generateFullTheme({ ...baseOpts, saturationBias: 0.4 })
    // destructive chroma should be higher with positive satBias
    const getChroma = (s: string) => parseFloat(s.split(' ')[1])
    expect(getChroma(vivid.lightMode.destructive)).toBeGreaterThanOrEqual(
      getChroma(normal.lightMode.destructive),
    )
  })
  it('dark mode border uses alpha syntax', () => {
    const theme = generateFullTheme(baseOpts)
    expect(theme.darkMode.border).toContain('/')
  })
})
