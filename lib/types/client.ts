import type { Profile, Settings } from '@prisma/client'

export interface ThemeColors {
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
    id: string
    name: string
    lightMode: ThemeColors
    darkMode: ThemeColors
    radius: string
    fontHeading: string
    fontBody: string
  }
  rootPageIndex: {
    id: string
    slug: string
    basePath: string
    heroEnabled: boolean
  } | null
  rootCourse: {
    id: string
    slug: string
    heroEnabled: boolean
  } | null
  // Reason: keeping string | null (not undefined) to remain compatible with
  // the Prisma Settings type which defines the field as nullable, not optional.
  receiverWalletAddress: string | null
  ogImage: {
    id: string
    source: { publicUrl: string | null } | null
  } | null
}

export interface ProfileData extends Profile {
  image: {
    source: {
      publicUrl: string
    }
  }
}

export interface ClientConfig {
  walletConnectProjectId: string
  alchemyBaseKey: string | null
  alchemyBaseSepoliaKey: string | null
  enableTestnets: boolean
  receiverWalletAddress: string | null
}
