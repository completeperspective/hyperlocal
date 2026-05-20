'use client'

import type { PageData } from '@/types/page'
import type { HeroFormState } from '@/types/page-index'
import { HeroPicker } from '@/ui/hero-picker'

interface HeroPanelProps {
  pageId: string
  initialData: PageData
  onFormChange?: (form: HeroFormState | null) => void
  onHeroEnabledChange?: (enabled: boolean) => void
}

export function HeroPanel({
  pageId,
  initialData,
  onFormChange,
  onHeroEnabledChange,
}: HeroPanelProps) {
  return (
    <HeroPicker
      parentEndpoint={`/api/v1/admin/pages/${pageId}`}
      initialHeroEnabled={initialData.heroEnabled ?? false}
      initialHero={initialData.hero ?? null}
      previewHref={`/${initialData.slug}`}
      onFormChange={onFormChange}
      onHeroEnabledChange={onHeroEnabledChange}
    />
  )
}
