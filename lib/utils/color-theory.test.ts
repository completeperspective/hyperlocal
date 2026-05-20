import { describe, expect, it } from 'vitest'
import {
  autoContrast,
  clampHue,
  formatOklch,
  harmonyHues,
  hueMoodLabel,
  wcagContrastRatio,
  wcagLevel,
} from './color-theory'

describe('clampHue', () => {
  it('wraps values above 360', () => expect(clampHue(380)).toBe(20))
  it('wraps negative values', () => expect(clampHue(-30)).toBe(330))
  it('keeps 0 as 0', () => expect(clampHue(0)).toBe(0))
  it('keeps 360 as 0', () => expect(clampHue(360)).toBe(0))
})

describe('formatOklch', () => {
  it('returns a valid oklch string', () =>
    expect(formatOklch(0.65, 0.22, 270)).toBe('oklch(0.6500 0.2200 270.00)'))
  it('zero chroma and hue', () =>
    expect(formatOklch(1, 0, 0)).toBe('oklch(1.0000 0.0000 0.00)'))
})

describe('wcagContrastRatio', () => {
  it('white on black has ratio ~21', () => {
    const ratio = wcagContrastRatio('oklch(1 0 0)', 'oklch(0 0 0)')
    expect(ratio).toBeCloseTo(21, 0)
  })
  it('same color has ratio 1', () => {
    expect(wcagContrastRatio('oklch(0.5 0 0)', 'oklch(0.5 0 0)')).toBeCloseTo(
      1,
      1,
    )
  })
  it('returns 1 for invalid input', () => {
    expect(wcagContrastRatio('not-a-color', 'oklch(0 0 0)')).toBeCloseTo(1, 0)
  })
})

describe('wcagLevel', () => {
  it('returns AAA for ratio >= 7', () => expect(wcagLevel(7.1)).toBe('AAA'))
  it('returns AA for ratio 4.5-7', () => expect(wcagLevel(5.0)).toBe('AA'))
  it('returns AA_LARGE for 3-4.5', () =>
    expect(wcagLevel(3.5)).toBe('AA_LARGE'))
  it('returns FAIL for ratio < 3', () => expect(wcagLevel(2.5)).toBe('FAIL'))
  it('returns AA at exactly 4.5', () => expect(wcagLevel(4.5)).toBe('AA'))
})

describe('autoContrast', () => {
  it('returns a light foreground for dark background', () => {
    const fg = autoContrast('oklch(0.2 0.01 270)')
    const ratio = wcagContrastRatio('oklch(0.2 0.01 270)', fg)
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })
  it('returns a dark foreground for light background', () => {
    const fg = autoContrast('oklch(0.9 0.01 270)')
    const ratio = wcagContrastRatio('oklch(0.9 0.01 270)', fg)
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })
  it('returns an oklch string', () => {
    const fg = autoContrast('oklch(0.5 0.2 180)')
    expect(fg).toMatch(/^oklch\(/)
  })
})

describe('harmonyHues', () => {
  it('complementary h2 is 180 degrees opposite', () => {
    const { h2 } = harmonyHues(90, 'complementary')
    expect(h2).toBe(270)
  })
  it('triadic h2 is 120 degrees away', () => {
    const { h2 } = harmonyHues(0, 'triadic')
    expect(h2).toBe(120)
  })
  it('monochromatic all hues equal primary', () => {
    const hues = harmonyHues(100, 'monochromatic')
    expect(hues.h2).toBe(100)
    expect(hues.h3).toBe(100)
  })
  it('tetradic h4 is 270 degrees from primary', () => {
    const { h4 } = harmonyHues(0, 'tetradic')
    expect(h4).toBe(270)
  })
})

describe('hueMoodLabel', () => {
  it('returns Fiery for red hues', () =>
    expect(hueMoodLabel(5).label).toBe('Fiery'))
  it('returns Natural for green hues', () =>
    expect(hueMoodLabel(110).label).toBe('Natural'))
  it('returns Electric for indigo hues', () =>
    expect(hueMoodLabel(265).label).toBe('Electric'))
  it('handles hue of 0', () => expect(hueMoodLabel(0).label).toBe('Fiery'))
})
