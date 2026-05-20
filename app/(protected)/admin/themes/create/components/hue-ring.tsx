'use client'

import { useEffect, useRef } from 'react'
import { clampHue } from '@/utils/color-theory'

interface HueRingProps {
  hue: number
  chroma: number
  lightness: number
  onChange: (hue: number) => void
}

const HUE_STOPS = Array.from({ length: 12 }, (_, i) => i * 30)

export function HueRing({ hue, chroma, lightness, onChange }: HueRingProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const conicStops = HUE_STOPS.map((h) => `oklch(0.65 0.22 ${h})`).join(', ')

  const angle = (hue - 90) * (Math.PI / 180)
  const radius = 87
  const dotX = 100 + radius * Math.cos(angle)
  const dotY = 100 + radius * Math.sin(angle)
  const primaryColor = `oklch(${lightness} ${chroma} ${hue})`

  function getHueFromEvent(e: PointerEvent | React.PointerEvent) {
    const el = containerRef.current
    if (!el) return hue
    const rect = el.getBoundingClientRect()
    const cx = rect.left + 100
    const cy = rect.top + 100
    const rawAngle =
      (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI + 90
    return clampHue(rawAngle)
  }

  function handlePointerDown(e: React.PointerEvent) {
    isDragging.current = true
    containerRef.current?.setPointerCapture(e.pointerId)
    onChange(getHueFromEvent(e))
  }

  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      if (!isDragging.current) return
      onChange(getHueFromEvent(e))
    }
    function handlePointerUp() {
      isDragging.current = false
    }
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange])

  function handleKeyDown(e: React.KeyboardEvent) {
    const step = e.shiftKey ? 10 : 1
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      onChange(clampHue(hue + step))
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      onChange(clampHue(hue - step))
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={containerRef}
        className="relative cursor-crosshair select-none"
        style={{ width: 200, height: 200, touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="slider"
        aria-label="Primary hue"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(hue)}
      >
        {/* Hue ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(${conicStops})`,
          }}
        />
        {/* Center hole */}
        <div
          className="absolute rounded-full bg-[--forge-panel]"
          style={{ inset: 26 }}
        />
        {/* Inner color preview */}
        <div
          className="absolute rounded-full"
          style={{
            width: 104,
            height: 104,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: primaryColor,
            transition: 'background 100ms ease-out',
          }}
        />
        {/* Indicator dot */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 14,
            height: 14,
            left: dotX - 7,
            top: dotY - 7,
            background: primaryColor,
            border: '2px solid oklch(0.12 0.006 265)',
            boxShadow: `0 0 0 3px ${primaryColor}, 0 0 0 5px oklch(0.12 0.006 265)`,
            transition: 'background 100ms ease-out',
          }}
        />
      </div>
      <p className="text-[11px] font-mono text-[--forge-text-muted]">
        H: {Math.round(hue)}°
      </p>
    </div>
  )
}
