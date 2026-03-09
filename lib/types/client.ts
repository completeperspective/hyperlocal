import type { Page, Profile, Settings } from '@prisma/client'

interface ThemeColors {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  positive: string
  positiveForeground: string
  info: string
  infoForeground: string
  warning: string
  warningForeground: string
  destructive: string
  destructiveForeground: string
  border: string
  input: string
  ring: string
  meta1: string
  meta2: string
  meta3: string
  meta4: string
  meta5: string
  sidebar: string
  sidebarForeground: string
  sidebarPrimary: string
  sidebarPrimaryForeground: string
  sidebarAccent: string
  sidebarAccentForeground: string
  sidebarBorder: string
  sidebarRing: string
}

export interface ClientSettings extends Settings {
  theme: {
    name: string
    lightMode: ThemeColors
    darkMode: ThemeColors
    radius: string
    fontPrimary: string // font-family
    fontSecondary: string // font-family
  }
  homePage: Page
}

export interface PageData extends Page {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any
  trustedHtml: string
}

export interface ProfileData extends Profile {
  image: {
    source: {
      publicUrl: string
    }
  }
}
