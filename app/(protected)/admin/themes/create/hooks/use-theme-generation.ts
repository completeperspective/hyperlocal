'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  generateFullTheme,
  generateLiveTokens,
  PENDING_TOKENS,
  type ThemeGeneratorOptions,
} from '@/utils/theme-generator'

export interface ThemeGenerationState {
  lightTokens: Record<string, string>
  darkTokens: Record<string, string>
  pendingTokenKeys: Set<string>
  isGenerating: boolean
  pendingCount: number
  generateAll: () => void
  setToken: (mode: 'light' | 'dark', key: string, value: string) => void
}

export function useThemeGeneration(
  opts: ThemeGeneratorOptions,
  initialTokens?: {
    light: Record<string, string>
    dark: Record<string, string>
  },
): ThemeGenerationState {
  const hasInitial = !!initialTokens
  const [lightTokens, setLightTokens] = useState<Record<string, string>>(
    initialTokens?.light ?? {},
  )
  const [darkTokens, setDarkTokens] = useState<Record<string, string>>(
    initialTokens?.dark ?? {},
  )
  const [pendingTokenKeys, setPendingTokenKeys] = useState<Set<string>>(
    new Set(),
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const prevOptsRef = useRef<ThemeGeneratorOptions | null>(null)
  // Tracks whether this is the very first effect run — used to skip marking
  // structural tokens as pending when the forge is pre-loaded with saved data.
  const isFirstRunRef = useRef(true)

  useEffect(() => {
    const prev = prevOptsRef.current
    const changed =
      !prev ||
      prev.primaryH !== opts.primaryH ||
      prev.primaryC !== opts.primaryC ||
      prev.primaryL !== opts.primaryL ||
      prev.harmonyMode !== opts.harmonyMode ||
      prev.saturationBias !== opts.saturationBias ||
      prev.lightnessBias !== opts.lightnessBias

    if (!changed) return
    prevOptsRef.current = opts

    // When editing a saved theme, preserve all saved tokens on the first run —
    // recalculating live tokens here would overwrite secondary/accent with values
    // derived from the default harmony mode, not the one used when the theme was saved.
    if (isFirstRunRef.current && hasInitial) {
      isFirstRunRef.current = false
      return
    }
    isFirstRunRef.current = false

    const live = generateLiveTokens(opts)
    setLightTokens((prev) => ({ ...prev, ...live }))
    setPendingTokenKeys(new Set(PENDING_TOKENS))
  }, [opts, hasInitial])

  const generateAll = useCallback(() => {
    setIsGenerating(true)
    setTimeout(() => {
      const { lightMode, darkMode } = generateFullTheme(opts)
      setLightTokens(lightMode)
      setDarkTokens(darkMode)
      setPendingTokenKeys(new Set())
      setIsGenerating(false)
    }, 50)
  }, [opts])

  const setToken = useCallback(
    (mode: 'light' | 'dark', key: string, value: string) => {
      if (mode === 'light') {
        setLightTokens((prev) => ({ ...prev, [key]: value }))
      } else {
        setDarkTokens((prev) => ({ ...prev, [key]: value }))
      }
    },
    [],
  )

  return {
    lightTokens,
    darkTokens,
    pendingTokenKeys,
    isGenerating,
    pendingCount: pendingTokenKeys.size,
    generateAll,
    setToken,
  }
}
