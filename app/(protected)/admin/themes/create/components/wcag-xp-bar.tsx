'use client'

import { useEffect, useRef, useState } from 'react'
import { Wand2 } from 'lucide-react'
import { hueMoodLabel } from '@/utils/color-theory'

interface WcagXpBarProps {
  score: number
  levelName: string
  previousScore?: number
  primaryH: number
  primaryC: number
  failingCount?: number
  onFix?: () => void
}

const LEVEL_THRESHOLDS = [
  { min: 0, max: 25, name: 'Draft', color: 'oklch(0.55 0.05 265)' },
  { min: 25, max: 45, name: 'Accessible', color: 'oklch(0.62 0.12 195)' },
  { min: 45, max: 65, name: 'Pro', color: 'oklch(0.65 0.18 140)' },
  { min: 65, max: 90, name: 'WCAG Warrior', color: 'oklch(0.65 0.22 85)' },
  {
    min: 90,
    max: 101,
    name: 'Pixel Perfect',
    color: 'linear-gradient(to right, oklch(0.72 0.2 300), oklch(0.72 0.2 30))',
  },
]

export function WcagXpBar({
  score,
  levelName,
  previousScore,
  primaryH,
  failingCount = 0,
  onFix,
}: WcagXpBarProps) {
  const [displayScore, setDisplayScore] = useState(score)
  const [levelUp, setLevelUp] = useState(false)
  const animRef = useRef<number>(0)
  const mood = hueMoodLabel(primaryH)

  // Animate score counter
  useEffect(() => {
    const start = displayScore
    const end = score
    if (start === end) return
    const duration = 700
    const startTime = performance.now()

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      setDisplayScore(Math.round(start + (end - start) * eased))
      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick)
      }
    }

    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score])

  // Level-up animation
  useEffect(() => {
    if (previousScore === undefined) return
    const prevBucket = LEVEL_THRESHOLDS.find(
      (t) => previousScore >= t.min && previousScore < t.max,
    )
    const currBucket = LEVEL_THRESHOLDS.find(
      (t) => score >= t.min && score < t.max,
    )
    if (prevBucket && currBucket && prevBucket.name !== currBucket.name) {
      setLevelUp(true)
      const t = setTimeout(() => setLevelUp(false), 1500)
      return () => clearTimeout(t)
    }
  }, [score, previousScore])

  const levelEntry =
    LEVEL_THRESHOLDS.find((t) => score >= t.min && score < t.max) ??
    LEVEL_THRESHOLDS[0]

  return (
    <div className="p-4 border-b border-border flex flex-col gap-3">
      {levelUp && (
        <style>{`
          @keyframes level-up {
            0%   { transform: scaleX(1); filter: brightness(1.5); }
            50%  { transform: scaleX(1.02); filter: brightness(2); }
            100% { transform: scaleX(1); filter: brightness(1); }
          }
          .animate-level-up { animation: level-up 1.5s ease-out; }
        `}</style>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-[--forge-text-muted]">
            Accessibility XP
          </p>
          <p className="text-sm font-bold text-[--forge-text]">{levelName}</p>
        </div>
        <span className="text-2xl font-black tabular-nums text-[--forge-accent]">
          {displayScore}
        </span>
      </div>

      {/* Bar */}
      <div
        className="h-3 rounded-full overflow-hidden bg-[--forge-panel-alt]"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Accessibility score: ${score} out of 100`}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out${levelUp ? ' animate-level-up' : ''}`}
          style={{
            width: `${score}%`,
            background: levelEntry.color,
          }}
        />
      </div>

      {/* Threshold markers */}
      <div className="flex justify-between text-[9px] text-[--forge-text-muted]">
        {LEVEL_THRESHOLDS.slice(1).map((t) => (
          <span key={t.name} className="text-center">
            {t.min}
          </span>
        ))}
      </div>

      {/* Mood + Fix row */}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-xl">{mood.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[--forge-text]">
            {mood.label}
          </p>
          <p className="text-[10px] text-[--forge-text-muted]">
            Hue {Math.round(primaryH)}°
          </p>
        </div>
        {failingCount > 0 && onFix && (
          <button
            onClick={onFix}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                       text-white transition-all hover:brightness-110 active:scale-[0.97] shrink-0"
            style={{ background: 'oklch(0.55 0.22 27)' }}
            title={`Auto-fix ${failingCount} failing contrast pair${failingCount > 1 ? 's' : ''}`}
          >
            <Wand2 size={12} />
            Fix {failingCount}
          </button>
        )}
      </div>
    </div>
  )
}
