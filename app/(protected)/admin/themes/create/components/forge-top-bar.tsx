'use client'

import { useState } from 'react'
import { Check, Copy, Moon, Palette, Sun, X } from 'lucide-react'

interface ForgeTopBarProps {
  themeName: string
  onThemeNameChange: (name: string) => void
  mode: 'light' | 'dark'
  onModeChange: (mode: 'light' | 'dark') => void
  onSave: () => void
  onExport: () => void
  onCancel: () => void
  isSaving: boolean
  canSave: boolean
  nameSuggestions: string[]
}

export function ForgeTopBar({
  themeName,
  onThemeNameChange,
  mode,
  onModeChange,
  onSave,
  onExport,
  onCancel,
  isSaving,
  canSave,
  nameSuggestions,
}: ForgeTopBarProps) {
  const [copied, setCopied] = useState(false)

  function handleExport() {
    onExport()
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="h-12 flex items-center px-4 gap-4 shrink-0 border-b border-border bg-[--forge-panel]">
      {/* Brand */}
      <div className="flex items-center gap-2 shrink-0">
        <Palette size={16} className="text-[--forge-accent]" />
        <span className="text-sm font-bold hidden sm:block text-[--forge-text]">
          Theme Forge
        </span>
      </div>

      {/* Name input */}
      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-xs">
          <input
            list="theme-name-suggestions"
            value={themeName}
            onChange={(e) => onThemeNameChange(e.target.value)}
            placeholder="Theme name…"
            className="w-full h-8 px-3 rounded-md text-sm focus:outline-none focus:ring-1 bg-[--forge-bg] text-[--forge-text] border border-border"
            style={
              {
                '--tw-ring-color': 'var(--forge-accent)',
              } as React.CSSProperties
            }
          />
          <datalist id="theme-name-suggestions">
            {nameSuggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Mode toggle */}
        <div className="flex rounded-md overflow-hidden border border-border">
          <button
            onClick={() => onModeChange('light')}
            className="h-8 px-3 flex items-center gap-1.5 text-xs transition-colors"
            style={
              mode === 'light'
                ? {
                    background: 'light-dark(oklch(0.32 0 0), oklch(0.42 0 0))',
                    color: 'white',
                  }
                : {
                    background: 'var(--forge-panel-alt)',
                    color: 'var(--forge-text-muted)',
                  }
            }
          >
            <Sun size={12} />
            <span className="hidden sm:block">Light</span>
          </button>
          <button
            onClick={() => onModeChange('dark')}
            className="h-8 px-3 flex items-center gap-1.5 text-xs transition-colors"
            style={
              mode === 'dark'
                ? {
                    background: 'light-dark(oklch(0.32 0 0), oklch(0.42 0 0))',
                    color: 'white',
                  }
                : {
                    background: 'var(--forge-panel-alt)',
                    color: 'var(--forge-text-muted)',
                  }
            }
          >
            <Moon size={12} />
            <span className="hidden sm:block">Dark</span>
          </button>
        </div>

        {/* Export */}
        <button
          onClick={handleExport}
          disabled={!canSave}
          title="Copy theme JSON to clipboard"
          className="h-8 px-3 rounded-md text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 hover:brightness-110 active:scale-[0.97] border border-border"
          style={{
            background: copied
              ? 'oklch(0.55 0.18 140)'
              : 'var(--forge-panel-alt)',
            color: copied ? 'white' : 'var(--forge-text-muted)',
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span className="hidden sm:block">
            {copied ? 'Copied!' : 'Export'}
          </span>
        </button>

        {/* Save */}
        <button
          onClick={onSave}
          disabled={!canSave || isSaving}
          className="h-8 px-4 rounded-md text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.97]"
          style={{
            background: 'light-dark(oklch(0.32 0 0), oklch(0.42 0 0))',
            color: 'white',
          }}
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>

        {/* Cancel */}
        <button
          onClick={onCancel}
          className="h-8 w-8 flex items-center justify-center rounded-md transition-colors hover:bg-[--forge-panel-alt] text-[--forge-text-muted]"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
