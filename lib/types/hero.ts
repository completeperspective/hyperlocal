export interface HeroSummary {
  id: string
  name?: string | null
  heroTitle?: string | null
  heroEyebrow?: string | null
  heroBackgroundImage?: string | null
  linkedCount?: number
}

export interface HeroData {
  id: string
  name: string | null
  heroEyebrow: string | null
  heroTitle: string | null
  heroTitleHighlight: string | null
  heroDescription: string | null
  heroCtaLabel: string | null
  heroCtaHref: string | null
  heroSecondaryLabel: string | null
  heroSecondaryHref: string | null
  heroStat1Value: string | null
  heroStat1Label: string | null
  heroStat2Value: string | null
  heroStat2Label: string | null
  heroStat3Value: string | null
  heroStat3Label: string | null
  heroImage: string | null
  heroImageBadgeTitle: string | null
  heroImageBadgeSubtitle: string | null
  heroBackgroundImage: string | null
  heroBackgroundImageMobile: string | null
  heroFullscreen: boolean
  heroHideGrid: boolean
}
