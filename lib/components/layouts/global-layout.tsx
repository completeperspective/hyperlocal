'use client'

import { ReactNode } from 'react'
import type { ClientSettings } from '@/types'
import type { ThemeColors } from '@/types/client'

const colorMap: [string, keyof ThemeColors][] = [
  ['--foreground', 'foreground'],
  ['--background', 'background'],
  ['--card', 'card'],
  ['--card-foreground', 'cardForeground'],
  ['--popover', 'popover'],
  ['--popover-foreground', 'popoverForeground'],
  ['--primary', 'primary'],
  ['--primary-foreground', 'primaryForeground'],
  ['--secondary', 'secondary'],
  ['--secondary-foreground', 'secondaryForeground'],
  ['--muted', 'muted'],
  ['--muted-foreground', 'mutedForeground'],
  ['--accent', 'accent'],
  ['--accent-foreground', 'accentForeground'],
  ['--positive', 'positive'],
  ['--positive-foreground', 'positiveForeground'],
  ['--info', 'info'],
  ['--info-foreground', 'infoForeground'],
  ['--warning', 'warning'],
  ['--warning-foreground', 'warningForeground'],
  ['--destructive', 'destructive'],
  ['--destructive-foreground', 'destructiveForeground'],
  ['--border', 'border'],
  ['--input', 'input'],
  ['--ring', 'ring'],
  ['--meta-1', 'meta1'],
  ['--meta-2', 'meta2'],
  ['--meta-3', 'meta3'],
  ['--meta-4', 'meta4'],
  ['--meta-5', 'meta5'],
  ['--sidebar', 'sidebar'],
  ['--sidebar-foreground', 'sidebarForeground'],
  ['--sidebar-primary', 'sidebarPrimary'],
  ['--sidebar-primary-foreground', 'sidebarPrimaryForeground'],
  ['--sidebar-accent', 'sidebarAccent'],
  ['--sidebar-accent-foreground', 'sidebarAccentForeground'],
  ['--sidebar-border', 'sidebarBorder'],
  ['--sidebar-ring', 'sidebarRing'],
]

function buildGlobalCss(theme: NonNullable<ClientSettings['theme']>): string {
  // Reason: lightMode/darkMode come from a Keystone JSON field that may be null
  // at runtime even though the TypeScript type says ThemeColors. Cast defensively.
  const lm = theme.lightMode as ThemeColors | null
  const dm = theme.darkMode as ThemeColors | null

  const lightProps: string[] = []
  if (theme.radius) lightProps.push(`  --radius: ${theme.radius};`)
  if (theme.fontHeading)
    lightProps.push(`  --font-primary: ${theme.fontHeading};`)
  if (theme.fontBody) lightProps.push(`  --font-secondary: ${theme.fontBody};`)
  for (const [cssVar, key] of colorMap) {
    if (lm?.[key]) lightProps.push(`  ${cssVar}: ${lm[key]};`)
  }

  const darkProps: string[] = []
  for (const [cssVar, key] of colorMap) {
    if (dm?.[key]) darkProps.push(`  ${cssVar}: ${dm[key]};`)
  }

  const parts: string[] = []
  if (lightProps.length) parts.push(`:root {\n${lightProps.join('\n')}\n}`)
  if (darkProps.length) {
    parts.push(
      `@media (prefers-color-scheme: dark) {\n  :root {\n${darkProps.join('\n')}\n  }\n}`,
    )
  }
  return parts.join('\n')
}

export function GlobalLayout({
  theme,
  children,
}: {
  children: ReactNode
  theme?: ClientSettings['theme']
}) {
  const globalCss = theme ? buildGlobalCss(theme) : null
  return (
    <>
      {globalCss && <style dangerouslySetInnerHTML={{ __html: globalCss }} />}
      <div className="flex min-h-screen flex-col">{children}</div>
    </>
  )
}
