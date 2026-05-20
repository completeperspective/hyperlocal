'use client'

import { useRef, useState } from 'react'
import { Check, Loader2, Sparkles, X } from 'lucide-react'
import {
  CONTRAST_PAIRS,
  hexToOklch,
  oklchToHex,
  type WcagLevel,
} from '@/utils/color-theory'
import type { WcagPairResult } from '../hooks/use-wcag-score'

interface TokenGridProps {
  tokens: Record<string, string>
  pendingTokenKeys: Set<string>
  mode: 'light' | 'dark'
  pairResults: WcagPairResult[]
  isGenerating: boolean
  generateAll: () => void
  pendingCount: number
  onTokenChange?: (key: string, value: string) => void
}

const TOKEN_GROUPS: { label: string; tokens: string[] }[] = [
  { label: 'Core', tokens: ['background', 'foreground'] },
  {
    label: 'Cards & Popovers',
    tokens: ['card', 'cardForeground', 'popover', 'popoverForeground'],
  },
  {
    label: 'Brand',
    tokens: [
      'primary',
      'primaryForeground',
      'secondary',
      'secondaryForeground',
      'accent',
      'accentForeground',
    ],
  },
  {
    label: 'Status',
    tokens: [
      'info',
      'infoForeground',
      'warning',
      'warningForeground',
      'positive',
      'positiveForeground',
      'destructive',
      'destructiveForeground',
    ],
  },
  {
    label: 'UI Elements',
    tokens: ['muted', 'mutedForeground', 'border', 'input', 'ring'],
  },
  {
    label: 'Sidebar',
    tokens: [
      'sidebar',
      'sidebarForeground',
      'sidebarPrimary',
      'sidebarPrimaryForeground',
      'sidebarAccent',
      'sidebarAccentForeground',
      'sidebarBorder',
      'sidebarRing',
    ],
  },
  {
    label: 'Meta / Chart',
    tokens: ['meta1', 'meta2', 'meta3', 'meta4', 'meta5'],
  },
]

const BADGE_CONFIG = {
  AAA: {
    background:
      'light-dark(oklch(0.32 0.12 140 / 0.13), oklch(0.25 0.12 140 / 0.40))',
    color: 'light-dark(oklch(0.28 0.14 140),         oklch(0.72 0.14 140))',
    border:
      'light-dark(oklch(0.38 0.12 140 / 0.40), oklch(0.42 0.12 140 / 0.50))',
    label: 'AAA',
  },
  AA: {
    background:
      'light-dark(oklch(0.32 0.12 240 / 0.13), oklch(0.25 0.12 240 / 0.40))',
    color: 'light-dark(oklch(0.28 0.14 240),         oklch(0.70 0.14 240))',
    border:
      'light-dark(oklch(0.38 0.12 240 / 0.40), oklch(0.42 0.12 240 / 0.50))',
    label: 'AA',
  },
  AA_LARGE: {
    background:
      'light-dark(oklch(0.38 0.10 80 / 0.13),  oklch(0.30 0.10 80 / 0.40))',
    color: 'light-dark(oklch(0.32 0.13 75),          oklch(0.75 0.15 80))',
    border:
      'light-dark(oklch(0.40 0.10 80 / 0.40),  oklch(0.45 0.10 80 / 0.50))',
    label: 'AA-LG',
  },
  FAIL: {
    background:
      'light-dark(oklch(0.32 0.18 27 / 0.13),  oklch(0.25 0.18 27 / 0.40))',
    color: 'light-dark(oklch(0.38 0.20 27),          oklch(0.72 0.18 27))',
    border:
      'light-dark(oklch(0.42 0.18 27 / 0.40),  oklch(0.50 0.18 27 / 0.50))',
    label: 'FAIL',
  },
} as const

function WcagBadge({ level, ratio }: { level: WcagLevel; ratio: number }) {
  const cfg = BADGE_CONFIG[level]
  return (
    <span
      className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm shrink-0 border"
      style={{
        background: cfg.background,
        color: cfg.color,
        borderColor: cfg.border,
      }}
      title={`Contrast ratio: ${ratio.toFixed(2)}:1`}
    >
      {cfg.label}
    </span>
  )
}

interface TokenEditorProps {
  tokenKey: string
  value: string
  onChange: (key: string, value: string) => void
  onClose: () => void
}

function TokenEditor({ tokenKey, value, onChange, onClose }: TokenEditorProps) {
  const hexValue = oklchToHex(value)
  const [rawText, setRawText] = useState(value)
  const textRef = useRef<HTMLInputElement>(null)

  function handleHexChange(hex: string) {
    const oklch = hexToOklch(hex)
    setRawText(oklch)
    onChange(tokenKey, oklch)
  }

  function handleTextChange(text: string) {
    setRawText(text)
  }

  function handleTextCommit() {
    if (rawText.trim()) {
      onChange(tokenKey, rawText.trim())
    }
  }

  function handleTextKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleTextCommit()
      onClose()
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="mx-1 mb-1 rounded-lg p-2.5 flex flex-col gap-2 bg-[--forge-panel-alt] border border-border">
      <div className="flex items-center gap-2">
        {/* Color swatch picker — only when no alpha */}
        {hexValue && (
          <label
            className="relative cursor-pointer shrink-0"
            title="Pick color"
          >
            <div
              className="w-8 h-8 rounded-md border-2 overflow-hidden border-border"
              style={{ background: value }}
            />
            <input
              type="color"
              value={hexValue}
              onChange={(e) => handleHexChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              tabIndex={-1}
            />
          </label>
        )}
        {/* OKLCH text input */}
        <input
          ref={textRef}
          value={rawText}
          onChange={(e) => handleTextChange(e.target.value)}
          onBlur={handleTextCommit}
          onKeyDown={handleTextKeyDown}
          spellCheck={false}
          placeholder="oklch(…)"
          className="flex-1 text-xs font-mono bg-transparent rounded px-2 py-1.5 outline-none min-w-0 text-[--forge-text] border border-border"
          autoFocus
        />
        {/* Confirm */}
        <button
          onClick={() => {
            handleTextCommit()
            onClose()
          }}
          className="shrink-0 p-1.5 rounded hover:brightness-110 transition-all"
          style={{ background: 'oklch(0.55 0.18 140)', color: 'white' }}
          title="Confirm"
        >
          <Check size={12} />
        </button>
        {/* Close */}
        <button
          onClick={onClose}
          className="shrink-0 p-1.5 rounded hover:brightness-110 transition-all bg-[--forge-panel] text-[--forge-text-muted]"
          title="Cancel"
        >
          <X size={12} />
        </button>
      </div>
      <p className="text-[10px] text-[--forge-text-muted]">
        {hexValue
          ? 'Click the swatch to pick a color, or edit the OKLCH value directly.'
          : 'Edit the OKLCH value directly (alpha colors cannot use the picker).'}
      </p>
    </div>
  )
}

const bgPairMap = new Map(CONTRAST_PAIRS.map(([bg, fg]) => [bg, fg]))

export function TokenGrid({
  tokens,
  pendingTokenKeys,
  pairResults,
  isGenerating,
  generateAll,
  pendingCount,
  onTokenChange,
}: TokenGridProps) {
  const pairMap = new Map(pairResults.map((r) => [r.bg, r]))
  const [editingKey, setEditingKey] = useState<string | null>(null)
  let rowIndex = 0

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {isGenerating && (
        <style>{`
          @keyframes token-flash {
            0%   { background-color: transparent; }
            30%  { background-color: oklch(0.72 0.18 265 / 20%); }
            100% { background-color: transparent; }
          }
        `}</style>
      )}

      {/* Scroll container — plain overflow div so height resolves correctly in flex */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
        {TOKEN_GROUPS.map(({ label, tokens: groupTokens }) => (
          <div key={label}>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-3 mb-1 pt-2 border-t text-[--forge-text-muted] border-border">
              {label}
            </p>
            {groupTokens.map((tokenKey) => {
              const value = tokens[tokenKey]
              const isPending = pendingTokenKeys.has(tokenKey)
              const pair = pairMap.get(tokenKey)
              const isBgPair = bgPairMap.has(tokenKey)
              const idx = rowIndex++
              const isEditing = editingKey === tokenKey
              const canEdit = !!onTokenChange

              return (
                <div key={tokenKey}>
                  <div
                    className={`flex items-center gap-2 py-1 px-1 rounded transition-colors ${
                      canEdit
                        ? 'cursor-pointer hover:bg-[--forge-panel-alt]'
                        : 'hover:bg-[--forge-panel-alt]'
                    } ${isEditing ? 'bg-[--forge-panel-alt]' : isPending && !isGenerating ? 'bg-amber-400/10' : ''}`}
                    style={
                      isGenerating
                        ? ({
                            animation: `token-flash 400ms ease-in-out var(--delay) both`,
                            '--delay': `${idx * 40}ms`,
                          } as React.CSSProperties)
                        : undefined
                    }
                    onClick={() => {
                      if (!canEdit) return
                      setEditingKey(isEditing ? null : tokenKey)
                    }}
                    title={canEdit ? `Edit ${tokenKey}` : undefined}
                  >
                    {/* Swatch */}
                    <div
                      className="w-6 h-6 rounded shrink-0 relative overflow-hidden transition-colors duration-150"
                      style={{
                        background: value ?? 'transparent',
                        border: '1px solid rgba(0,0,0,0.2)',
                      }}
                    ></div>

                    {/* Label */}
                    <span className="text-xs flex-1 font-mono truncate text-[--forge-text]">
                      {tokenKey}
                    </span>

                    {/* Edit hint */}
                    {canEdit && !isEditing && (
                      <span className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity px-1 text-[--forge-text-muted]">
                        edit
                      </span>
                    )}

                    {/* WCAG badge */}
                    {isBgPair && pair && (
                      <WcagBadge level={pair.level} ratio={pair.ratio} />
                    )}
                    {isBgPair && !pair && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-sm border border-dashed text-[--forge-text-muted] border-border">
                        —
                      </span>
                    )}
                  </div>

                  {/* Inline editor */}
                  {isEditing && onTokenChange && value && (
                    <TokenEditor
                      tokenKey={tokenKey}
                      value={value}
                      onChange={(key, val) => {
                        onTokenChange(key, val)
                      }}
                      onClose={() => setEditingKey(null)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Generate button — always visible at bottom, outside the scroll container */}
      <div className="shrink-0 px-3 pt-2 pb-3 border-t border-border bg-[--forge-panel]">
        <button
          onClick={generateAll}
          disabled={pendingCount === 0 || isGenerating}
          className="w-full h-10 rounded-lg font-semibold text-sm text-white
                     shadow-lg disabled:opacity-40 disabled:cursor-not-allowed
                     hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          style={{
            background:
              'linear-gradient(to right, var(--forge-accent), oklch(0.72 0.2 300))',
          }}
        >
          {isGenerating ? (
            <Loader2 className="animate-spin size-4" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {pendingCount > 0
            ? `Generate All (${pendingCount} pending)`
            : 'Generated ✓'}
        </button>
      </div>
    </div>
  )
}
