'use client'

import type { CourseData } from '@/types/course'
import type { HeroFormState } from '@/types/page-index'
import { HeroPicker } from '@/ui/hero-picker'

interface HeroPanelProps {
  courseId: string
  initialData: CourseData
  onFormChange?: (form: HeroFormState | null) => void
  onHeroEnabledChange?: (enabled: boolean) => void
}

export function HeroPanel({
  courseId,
  initialData,
  onFormChange,
  onHeroEnabledChange,
}: HeroPanelProps) {
  return (
    <HeroPicker
      parentEndpoint={`/api/v1/admin/courses/${courseId}`}
      initialHeroEnabled={initialData.heroEnabled ?? false}
      initialHero={initialData.hero ?? null}
      previewHref={`/courses/${initialData.slug}`}
      onFormChange={onFormChange}
      onHeroEnabledChange={onHeroEnabledChange}
    />
  )
}
