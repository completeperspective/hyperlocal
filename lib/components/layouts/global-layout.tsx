'use client'

import { ReactNode } from 'react'
import { css, Global } from '@emotion/react'
import { ClientSettings } from '@/types'

export function GlobalLayout({
  theme,
  children,
}: {
  children: ReactNode
  theme?: ClientSettings['theme']
}) {
  return (
    <>
      {theme && (
        <Global
          styles={css`
            :root {
              --radius: ${theme?.radius};
              --font-primary: ${theme?.fontPrimary};
              --font-secondary: ${theme?.fontSecondary};

              --foreground: ${theme?.lightMode.foreground};
              --background: ${theme?.lightMode.background};
              --card: ${theme?.lightMode.card};
              --card-foreground: ${theme?.lightMode.foreground};
              --popover: ${theme?.lightMode.popover};
              --popover-foreground: ${theme?.lightMode.popoverForeground};
              --primary: ${theme?.lightMode.primary};
              --primary-foreground: ${theme?.lightMode.primaryForeground};
              --secondary: ${theme?.lightMode.secondary};
              --secondary-foreground: ${theme?.lightMode.secondaryForeground};
              --muted: ${theme?.lightMode.muted};
              --muted-foreground: ${theme?.lightMode.mutedForeground};
              --accent: ${theme?.lightMode.accent};
              --accent-foreground: ${theme?.lightMode.accentForeground};
              --positive: ${theme?.lightMode.positive};
              --positive-foreground: ${theme?.lightMode.positiveForeground};
              --info: ${theme?.lightMode.info};
              --info-foreground: ${theme?.lightMode.infoForeground};
              --warning: ${theme?.lightMode.warning};
              --warning-foreground: ${theme?.lightMode.warningForeground};
              --destructive: ${theme?.lightMode.destructive};
              --destructive-foreground: ${theme?.lightMode
                .destructiveForeground};
              --border: ${theme?.lightMode.border};
              --input: ${theme?.lightMode.input};
              --ring: ${theme?.lightMode.ring};
              --meta-1: ${theme?.lightMode.meta1};
              --meta-2: ${theme?.lightMode.meta2};
              --meta-3: ${theme?.lightMode.meta3};
              --meta-4: ${theme?.lightMode.meta4};
              --meta-5: ${theme?.lightMode.meta5};
              --sidebar: ${theme?.lightMode.sidebar};
              --sidebar-foreground: ${theme?.lightMode.sidebarForeground};
              --sidebar-primary: ${theme?.lightMode.sidebarPrimary};
              --sidebar-primary-foreground: ${theme?.lightMode
                .sidebarPrimaryForeground};
              --sidebar-accent: ${theme?.lightMode.sidebarAccent};
              --sidebar-accent-foreground: ${theme?.lightMode
                .sidebarAccentForeground};
              --sidebar-border: ${theme?.lightMode.sidebarBorder};
              --sidebar-ring: ${theme?.lightMode.sidebarRing};
            }
            @media (prefers-color-scheme: dark) {
              :root {
                --foreground: ${theme?.darkMode.foreground};
                --background: ${theme?.darkMode.background};
                --card: ${theme?.darkMode.card};
                --card-foreground: ${theme?.darkMode.foreground};
                --popover: ${theme?.darkMode.popover};
                --popover-foreground: ${theme?.darkMode.popoverForeground};
                --primary: ${theme?.darkMode.primary};
                --primary-foreground: ${theme?.darkMode.primaryForeground};
                --secondary: ${theme?.darkMode.secondary};
                --secondary-foreground: ${theme?.darkMode.secondaryForeground};
                --muted: ${theme?.darkMode.muted};
                --muted-foreground: ${theme?.darkMode.mutedForeground};
                --accent: ${theme?.darkMode.accent};
                --accent-foreground: ${theme?.darkMode.accentForeground};
                --positive: ${theme?.darkMode.positive};
                --positive-foreground: ${theme?.darkMode.positiveForeground};
                --info: ${theme?.darkMode.info};
                --info-foreground: ${theme?.darkMode.infoForeground};
                --warning: ${theme?.darkMode.warning};
                --warning-foreground: ${theme?.darkMode.warningForeground};
                --destructive: ${theme?.darkMode.destructive};
                --destructive-foreground: ${theme?.darkMode
                  .destructiveForeground};
                --border: ${theme?.darkMode.border};
                --input: ${theme?.darkMode.input};
                --ring: ${theme?.darkMode.ring};
                --meta-1: ${theme?.darkMode.meta1};
                --meta-2: ${theme?.darkMode.meta2};
                --meta-3: ${theme?.darkMode.meta3};
                --meta-4: ${theme?.darkMode.meta4};
                --meta-5: ${theme?.darkMode.meta5};
                --sidebar: ${theme?.darkMode.sidebar};
                --sidebar-foreground: ${theme?.darkMode.sidebarForeground};
                --sidebar-primary: ${theme?.darkMode.sidebarPrimary};
                --sidebar-primary-foreground: ${theme?.darkMode
                  .sidebarPrimaryForeground};
                --sidebar-accent: ${theme?.darkMode.sidebarAccent};
                --sidebar-accent-foreground: ${theme?.darkMode
                  .sidebarAccentForeground};
                --sidebar-border: ${theme?.darkMode.sidebarBorder};
                --sidebar-ring: ${theme?.darkMode.sidebarRing};
              }
            }
          `}
        />
      )}
      {children}
    </>
  )
}
