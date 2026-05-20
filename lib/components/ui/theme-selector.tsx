'use client'

import type { ThemeColors } from '@/types/client'
import { Label } from '@/ui/label'

export interface ThemeSummary {
  id: string
  name: string
  lightMode: ThemeColors
  darkMode: ThemeColors
  radius: string
  fontHeading: string
  fontBody: string
}

interface ThemeSelectorProps {
  themes: ThemeSummary[]
  value: string | null
  onChange: (themeId: string | null) => void
  entityId: string
}

export function ThemeSelector({ themes, value, onChange }: ThemeSelectorProps) {
  const selected = themes.find((t) => t.id === value) ?? null

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="theme-select">Theme</Label>
      <select
        id="theme-select"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <option value="">Global default (Settings)</option>
        {themes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      {selected ? (
        <div className="flex items-center gap-2 mt-1">
          {[
            selected.lightMode.primary,
            selected.lightMode.secondary,
            selected.lightMode.accent,
            selected.lightMode.background,
          ].map((color, i) => (
            <span
              key={i}
              className="size-4 rounded-full border border-border/50 shrink-0"
              style={{ background: color }}
              aria-hidden="true"
            />
          ))}
          <a
            href={`/admin/themes/${selected.id}/edit`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-xs text-primary hover:underline"
          >
            Edit in Theme Forge
          </a>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          No override — visitors see the global theme from Settings.
        </p>
      )}
    </div>
  )
}
