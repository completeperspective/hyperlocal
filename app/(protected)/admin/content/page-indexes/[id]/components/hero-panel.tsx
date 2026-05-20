'use client'

import type { HeroFormState, PageIndexData } from '@/types/page-index'
import { HeroPicker } from '@/ui/hero-picker'

interface HeroPanelProps {
  indexId: string
  initialData: PageIndexData
  onFormChange?: (form: HeroFormState | null) => void
  onHeroEnabledChange?: (enabled: boolean) => void
}

export function HeroPanel({
  indexId,
  initialData,
  onFormChange,
  onHeroEnabledChange,
}: HeroPanelProps) {
  return (
    <HeroPicker
      parentEndpoint={`/api/v1/admin/page-indexes/${indexId}`}
      initialHeroEnabled={initialData.heroEnabled ?? false}
      initialHero={initialData.hero ?? null}
      previewHref={`/${initialData.basePath}`}
      onFormChange={onFormChange}
      onHeroEnabledChange={onHeroEnabledChange}
    />
  )
}
