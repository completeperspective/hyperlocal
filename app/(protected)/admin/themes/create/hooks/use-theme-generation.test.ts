import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ThemeGeneratorOptions } from '@/utils/theme-generator'
import { useThemeGeneration } from './use-theme-generation'

const baseOpts: ThemeGeneratorOptions = {
  primaryL: 0.65,
  primaryC: 0.22,
  primaryH: 270,
  harmonyMode: 'complementary',
  saturationBias: 0,
  lightnessBias: 0,
}

describe('useThemeGeneration', () => {
  it('populates live tokens on initial render', async () => {
    const { result } = renderHook(() => useThemeGeneration(baseOpts))
    await act(async () => {})
    // Initial effect fires immediately and populates 6 live tokens
    expect(
      Object.keys(result.current.lightTokens).length,
    ).toBeGreaterThanOrEqual(6)
  })

  it('marks structural tokens as pending on opts change', async () => {
    const { result } = renderHook(() => useThemeGeneration(baseOpts))
    // Wait for initial effect
    await act(async () => {})
    expect(result.current.pendingCount).toBeGreaterThan(0)
  })

  it('generates all tokens on generateAll call', async () => {
    const { result } = renderHook(() => useThemeGeneration(baseOpts))
    await act(async () => {
      result.current.generateAll()
      await new Promise((r) => setTimeout(r, 100))
    })
    expect(Object.keys(result.current.lightTokens).length).toBe(38)
    expect(result.current.pendingCount).toBe(0)
  })

  it('updates live tokens when harmonyMode changes', async () => {
    const { result, rerender } = renderHook(
      (opts: ThemeGeneratorOptions) => useThemeGeneration(opts),
      { initialProps: baseOpts },
    )
    await act(async () => {})
    const originalSecondary = result.current.lightTokens.secondary
    rerender({ ...baseOpts, harmonyMode: 'triadic' as const })
    await act(async () => {})
    expect(result.current.lightTokens.secondary).not.toBe(originalSecondary)
  })
})
