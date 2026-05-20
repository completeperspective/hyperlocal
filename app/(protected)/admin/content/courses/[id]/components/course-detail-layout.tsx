'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { CourseData } from '@/types/course'
import type { HeroFormState } from '@/types/page-index'
import { Hero } from '@/ui/hero'
import {
  buildHeroConfigFromFormState,
  heroFormStateFromSource,
} from '@/ui/hero-form-section'
import { ScopedThemeWrapper } from '@/ui/scoped-theme-wrapper'
import type { ThemeSummary } from '@/ui/theme-selector'
import { CourseEditor } from './course-editor'

interface CourseDetailLayoutProps {
  data: CourseData
  themes: ThemeSummary[]
  initialThemeId: string | null
}

export function CourseDetailLayout({
  data,
  themes,
  initialThemeId,
}: CourseDetailLayoutProps) {
  const [liveHeroForm, setLiveHeroForm] = useState<HeroFormState | null>(() =>
    data.hero ? heroFormStateFromSource(data.hero) : null,
  )
  const [heroEnabled, setHeroEnabled] = useState(data.heroEnabled ?? false)
  const [currentThemeId, setCurrentThemeId] = useState<string | null>(
    initialThemeId,
  )

  const currentTheme = themes.find((t) => t.id === currentThemeId) ?? null
  const showBanner = heroEnabled && liveHeroForm !== null

  return (
    <>
      {showBanner && (
        <ScopedThemeWrapper theme={currentTheme}>
          <div className="relative">
            <Hero config={buildHeroConfigFromFormState(liveHeroForm)} />
            <div className="absolute bottom-2 right-3 text-[10px] text-white/40 pointer-events-none select-none">
              Live preview
            </div>
          </div>
        </ScopedThemeWrapper>
      )}

      <section className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/admin/content"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-4" />
            Content
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-xl font-bold truncate">{data.title}</h1>
        </div>

        <CourseEditor
          data={data}
          themes={themes}
          initialThemeId={initialThemeId}
          onThemeChange={setCurrentThemeId}
          onHeroFormChange={setLiveHeroForm}
          onHeroEnabledChange={setHeroEnabled}
        />
      </section>
    </>
  )
}
