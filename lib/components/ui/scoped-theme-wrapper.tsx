import type { ReactNode } from 'react'
import type { ThemeColors } from '@/types/client'

interface ScopedTheme {
  id: string
  lightMode: ThemeColors
  darkMode: ThemeColors
  radius: string
  fontHeading: string
  fontBody: string
}

interface ScopedThemeWrapperProps {
  theme?: ScopedTheme | null
  children: ReactNode
  /**
   * When true, CSS variables are written to :root instead of a scoped
   * [data-scoped-theme] attribute. This makes the theme affect the header,
   * body background, and sidebar — everything on the page. Use for public
   * course/page-index pages. Leave false (default) for admin preview panels
   * where the theme must stay contained within a wrapper div.
   */
  global?: boolean
}

function buildTokenBlock(
  selector: string,
  t: ThemeColors,
  meta: { radius?: string; fontHeading?: string; fontBody?: string } = {},
): string {
  const props: string[] = []
  if (meta.radius) props.push(`  --radius: ${meta.radius};`)
  if (meta.fontHeading) props.push(`  --font-primary: ${meta.fontHeading};`)
  if (meta.fontBody) props.push(`  --font-secondary: ${meta.fontBody};`)

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
    ['--sidebar', 'sidebar'],
    ['--sidebar-foreground', 'sidebarForeground'],
    ['--sidebar-primary', 'sidebarPrimary'],
    ['--sidebar-primary-foreground', 'sidebarPrimaryForeground'],
    ['--sidebar-accent', 'sidebarAccent'],
    ['--sidebar-accent-foreground', 'sidebarAccentForeground'],
    ['--sidebar-border', 'sidebarBorder'],
    ['--sidebar-ring', 'sidebarRing'],
  ]
  for (const [cssVar, key] of colorMap) {
    if (t[key]) props.push(`  ${cssVar}: ${t[key]};`)
  }

  return `${selector} {\n${props.join('\n')}\n}`
}

export function ScopedThemeWrapper({
  theme,
  children,
  global: isGlobal = false,
}: ScopedThemeWrapperProps) {
  if (!theme) return <>{children}</>

  if (isGlobal) {
    // Reason: targeting :root overrides the app-wide theme for every element on
    // the page — header, body background, sidebar — not just the content area.
    const lightCss = buildTokenBlock(':root', theme.lightMode, {
      radius: theme.radius,
      fontHeading: theme.fontHeading,
      fontBody: theme.fontBody,
    })
    const darkCss = buildTokenBlock(':root', theme.darkMode)
    const css = `${lightCss}\n@media (prefers-color-scheme: dark) {\n${darkCss}\n}`
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        {children}
      </>
    )
  }

  const attr = theme.id
  const lightCss = buildTokenBlock(
    `[data-scoped-theme="${attr}"]`,
    theme.lightMode,
    {
      radius: theme.radius,
      fontHeading: theme.fontHeading,
      fontBody: theme.fontBody,
    },
  )
  const darkCss = buildTokenBlock(
    `[data-scoped-theme="${attr}"]`,
    theme.darkMode,
  )
  const css = `${lightCss}\n@media (prefers-color-scheme: dark) {\n${darkCss}\n}`

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div data-scoped-theme={attr}>{children}</div>
    </>
  )
}
