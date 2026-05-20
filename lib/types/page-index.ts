import type { ThemeColors } from '@/types/client'
import type { HeroData } from '@/types/hero'

export interface PageGroupData {
  id: string
  title: string
  sortOrder: number
  pages: PageIndexPageData[]
}

export interface PageIndexPageData {
  id: string
  title: string
  slug: string
  status: string
}

export interface PageIndexData {
  id: string
  title: string
  slug: string
  basePath: string
  status: string
  publishedAt: string | null
  metaTitle: string | null
  metaDescription: string | null
  ogImage: {
    id: string
    title: string | null
    source?: { publicUrl?: string | null } | null
  } | null
  groupsLabel: string | null
  content: { document: unknown } | null
  trustedHtml: string | null
  customCss: string | null
  heroEnabled: boolean
  hero?: HeroData | null
  theme?: {
    id: string
    name: string
    lightMode: ThemeColors
    darkMode: ThemeColors
    radius: string
    fontHeading: string
    fontBody: string
  } | null
  pages: PageIndexPageData[]
  groups: PageGroupData[]
}

export interface PageIndexListItem {
  id: string
  title: string
  slug: string
  basePath: string
  status: string
  pageCount: number
  groupsLabel?: string
}

export interface HeroFormState {
  id: string | null
  name: string
  heroEyebrow: string
  heroTitle: string
  heroTitleHighlight: string
  heroDescription: string
  heroCtaLabel: string
  heroCtaHref: string
  heroSecondaryLabel: string
  heroSecondaryHref: string
  stats: Array<{ value: string; label: string }>
  heroImage: string
  heroImageBadgeTitle: string
  heroImageBadgeSubtitle: string
  heroBackgroundImage: string
  heroBackgroundImageMobile: string
  heroFullscreen: boolean
  heroHideGrid: boolean
}
