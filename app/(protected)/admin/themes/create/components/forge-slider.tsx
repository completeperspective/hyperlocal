'use client'

import { Slider } from '@/ui/slider'

interface ForgeSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  gradientCss?: string
  displayValue?: string
}

export function ForgeSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  gradientCss,
  displayValue,
}: ForgeSliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-xs uppercase tracking-wide font-medium text-[--forge-text-muted]">
          {label}
        </span>
        <span className="text-xs font-mono text-[--forge-text]">
          {displayValue ?? value}
        </span>
      </div>
      <div
        className="relative"
        style={
          gradientCss
            ? ({ '--slider-track-bg': gradientCss } as React.CSSProperties)
            : {}
        }
      >
        {gradientCss && (
          <style>{`
            [data-forge-slider] [data-slot="slider-track"] {
              background: var(--slider-track-bg) !important;
            }
          `}</style>
        )}
        <Slider
          data-forge-slider
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={([v]) => onChange(v)}
          className="w-full"
        />
      </div>
    </div>
  )
}
