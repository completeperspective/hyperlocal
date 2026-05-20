'use client'

import { useMemo } from 'react'
import {
  CONTRAST_PAIRS,
  wcagContrastRatio,
  wcagLevel,
  type WcagLevel,
} from '@/utils/color-theory'

export interface WcagPairResult {
  bg: string
  fg: string
  ratio: number
  level: WcagLevel
}

export type WcagLevelName =
  | 'Draft'
  | 'Accessible'
  | 'Pro'
  | 'WCAG Warrior'
  | 'Pixel Perfect'

export interface WcagScoreResult {
  score: number
  level: WcagLevelName
  pairResults: WcagPairResult[]
}

function scoreName(score: number): WcagLevelName {
  if (score >= 90) return 'Pixel Perfect'
  if (score >= 65) return 'WCAG Warrior'
  if (score >= 45) return 'Pro'
  if (score >= 25) return 'Accessible'
  return 'Draft'
}

export function useWcagScore(
  tokenMap: Record<string, string>,
): WcagScoreResult {
  return useMemo(() => {
    const pairResults: WcagPairResult[] = []
    let total = 0

    for (const [bg, fg] of CONTRAST_PAIRS) {
      const bgVal = tokenMap[bg]
      const fgVal = tokenMap[fg]
      if (!bgVal || !fgVal) continue
      const ratio = wcagContrastRatio(bgVal, fgVal)
      const level = wcagLevel(ratio)
      pairResults.push({ bg, fg, ratio, level })
      total +=
        level === 'AAA'
          ? 1.0
          : level === 'AA'
            ? 0.75
            : level === 'AA_LARGE'
              ? 0.4
              : 0
    }

    const maxPairs = CONTRAST_PAIRS.length
    const score = maxPairs > 0 ? Math.round((total / maxPairs) * 100) : 0

    return { score, level: scoreName(score), pairResults }
  }, [tokenMap])
}
