'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { HeroListItem } from '@/server/helpers/get-heroes-list'
import type { HeroData } from '@/types/hero'
import type { HeroFormState } from '@/types/page-index'
import { Badge } from '@/ui/badge'
import { Hero } from '@/ui/hero'
import { HeroEditor } from '@/ui/hero-editor'
import {
  buildHeroConfigFromFormState,
  heroFormStateFromSource,
} from '@/ui/hero-form-section'

interface HeroDetailClientProps {
  hero: HeroData
  displayName: string
  linkedEntities: HeroListItem['linkedEntities']
}

const entityTypeLabels = {
  course: 'Course',
  page: 'Page',
  'page-index': 'Page Route',
} as const

const entityEditHref = (e: HeroListItem['linkedEntities'][number]) => {
  if (e.type === 'course') return `/admin/content/courses/${e.id}`
  if (e.type === 'page') return `/admin/content/pages/${e.id}`
  return `/admin/content/page-indexes/${e.id}`
}

export function HeroDetailClient({
  hero,
  displayName,
  linkedEntities,
}: HeroDetailClientProps) {
  const [liveForm, setLiveForm] = useState<HeroFormState>(() =>
    heroFormStateFromSource(hero),
  )

  return (
    <>
      {/* Full-width live preview */}
      <div className="relative">
        <Hero config={buildHeroConfigFromFormState(liveForm)} />
        <div className="absolute bottom-2 right-3 text-[10px] text-white/40 pointer-events-none select-none">
          Live preview
        </div>
      </div>

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
          <span className="text-sm text-muted-foreground">Heroes</span>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-xl font-bold truncate">{displayName}</h1>
        </div>

        {linkedEntities.length > 0 && (
          <div className="rounded-md border border-border p-4 flex flex-col gap-2">
            <p className="text-sm font-medium">Used by</p>
            <div className="flex flex-wrap gap-2">
              {linkedEntities.map((e) => (
                <Link key={`${e.type}-${e.id}`} href={entityEditHref(e)}>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                  >
                    {entityTypeLabels[e.type]}: {e.title}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        <HeroEditor
          parentEndpoint={`/api/v1/admin/heroes/${hero.id}`}
          initialHero={hero}
          onFormChange={setLiveForm}
          skipLink={true}
        />
      </section>
    </>
  )
}
