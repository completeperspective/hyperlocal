'use client'

import { useEffect, useRef, useState } from 'react'
import { hexToOklch, oklchToHex } from '@/utils/color-theory'

interface PrimaryColorInputProps {
  primaryL: number
  primaryC: number
  primaryH: number
  onChange: (l: number, c: number, h: number) => void
}

function parseColorInput(
  raw: string,
): { l: number; c: number; h: number } | null {
  const trimmed = raw.trim()

  // OKLCH — matches oklch(L C H) with optional % on L
  const oklchMatch = trimmed.match(
    /oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)/i,
  )
  if (oklchMatch) {
    let l = parseFloat(oklchMatch[1])
    const c = parseFloat(oklchMatch[2])
    const h = parseFloat(oklchMatch[3])
    // If L looks like a percentage (>1), normalise it
    if (l > 1) l = l / 100
    if (isNaN(l) || isNaN(c) || isNaN(h)) return null
    return {
      l: Math.min(1, Math.max(0, l)),
      c: Math.max(0, c),
      h: ((h % 360) + 360) % 360,
    }
  }

  // Hex — convert via culori
  const hexLike = /^#?[0-9a-fA-F]{3,8}$/.test(trimmed)
    ? trimmed.startsWith('#')
      ? trimmed
      : `#${trimmed}`
    : null
  if (hexLike) {
    const oklch = hexToOklch(hexLike)
    const m = oklch.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
    if (m) {
      return {
        l: parseFloat(m[1]),
        c: parseFloat(m[2]),
        h: parseFloat(m[3]),
      }
    }
  }

  return null
}

export function PrimaryColorInput({
  primaryL,
  primaryC,
  primaryH,
  onChange,
}: PrimaryColorInputProps) {
  const primaryOklch = `oklch(${primaryL.toFixed(4)} ${primaryC.toFixed(4)} ${primaryH.toFixed(2)})`
  const hexValue = oklchToHex(primaryOklch)

  const [draft, setDraft] = useState(primaryOklch)
  const [isError, setIsError] = useState(false)
  const isFocused = useRef(false)

  // Keep draft in sync with external slider/ring changes when not editing
  useEffect(() => {
    if (!isFocused.current) {
      setDraft(primaryOklch)
      setIsError(false)
    }
  }, [primaryOklch])

  function commit(value: string) {
    const parsed = parseColorInput(value)
    if (parsed) {
      setIsError(false)
      setDraft(
        `oklch(${parsed.l.toFixed(4)} ${parsed.c.toFixed(4)} ${parsed.h.toFixed(2)})`,
      )
      onChange(parsed.l, parsed.c, parsed.h)
    } else {
      setIsError(true)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      commit(draft)
      e.currentTarget.blur()
    }
    if (e.key === 'Escape') {
      setDraft(primaryOklch)
      setIsError(false)
      e.currentTarget.blur()
    }
  }

  return (
    <div className="flex items-center gap-2 w-full">
      {/* Native hex color picker hidden behind the swatch */}
      <label
        className="relative shrink-0 cursor-pointer"
        title="Pick color"
        style={{ width: 32, height: 32 }}
      >
        <div
          className="w-full h-full rounded-lg border-2"
          style={{
            background: primaryOklch,
            borderColor: isError ? 'oklch(0.6 0.22 27)' : 'var(--border)',
            transition: 'background 100ms',
          }}
        />
        {hexValue && (
          <input
            type="color"
            value={hexValue}
            onChange={(e) => {
              const oklch = hexToOklch(e.target.value)
              const parsed = parseColorInput(oklch)
              if (parsed) {
                onChange(parsed.l, parsed.c, parsed.h)
              }
            }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            tabIndex={-1}
          />
        )}
      </label>

      {/* Text input */}
      <input
        type="text"
        value={draft}
        spellCheck={false}
        placeholder="oklch(…) or #hex"
        onFocus={() => {
          isFocused.current = true
        }}
        onBlur={() => {
          isFocused.current = false
          commit(draft)
        }}
        onChange={(e) => {
          setDraft(e.target.value)
          setIsError(false)
        }}
        onKeyDown={handleKeyDown}
        className="flex-1 text-xs font-mono rounded-lg px-2.5 py-2 outline-none min-w-0 transition-colors bg-[--forge-panel-alt]"
        style={{
          color: isError ? 'oklch(0.72 0.18 27)' : 'var(--forge-text)',
          border: `1px solid ${isError ? 'oklch(0.6 0.22 27)' : 'var(--border)'}`,
        }}
      />
    </div>
  )
}
