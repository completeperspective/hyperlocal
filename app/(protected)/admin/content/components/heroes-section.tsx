'use client'

import Link from 'next/link'
import type { HeroListItem } from '@/server/helpers/get-heroes-list'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { buildGlowStyle, gridStyle } from '@/ui/hero-styles'

interface HeroesSectionProps {
  heroes: HeroListItem[]
}

function UsageBadge({ count }: { count: number }) {
  if (count === 1) return null
  if (count === 0) {
    return (
      <span className="absolute top-2 right-2 rounded-full bg-warning/20 border border-warning/40 text-warning text-[10px] font-semibold px-2 py-0.5">
        Unused
      </span>
    )
  }
  return (
    <span className="absolute top-2 right-2 rounded-full bg-primary/20 border border-primary/40 text-primary text-[10px] font-semibold px-2 py-0.5">
      Shared
    </span>
  )
}

function HeroCard({ hero }: { hero: HeroListItem }) {
  const displayName = hero.name || hero.heroTitle || hero.heroEyebrow
  const typeLabel = {
    course: 'Course',
    page: 'Page',
    'page-index': 'Page Route',
  } as const

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
      {/* Gradient swatch */}
      <div
        className="h-24 relative overflow-hidden"
        style={{ background: 'var(--hero-surface)' }}
      >
        <div aria-hidden="true" style={buildGlowStyle()} />
        <div aria-hidden="true" style={gridStyle} />
        {hero.heroBackgroundImage && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero.heroBackgroundImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.55)' }}
            />
          </>
        )}
        <UsageBadge count={hero.linkedCount} />
      </div>

      {/* Body */}
      <div className="px-3 py-2 flex flex-col gap-1 flex-1">
        {displayName ? (
          <p className="text-sm font-semibold truncate">{displayName}</p>
        ) : (
          <p className="text-sm font-semibold italic text-muted-foreground">
            Untitled Hero
          </p>
        )}
        {hero.heroEyebrow && (
          <p className="text-xs text-muted-foreground truncate">
            {hero.heroEyebrow}
          </p>
        )}
        {hero.heroTitle && displayName !== hero.heroTitle && (
          <p className="text-xs text-foreground/70 truncate">
            {hero.heroTitle}
          </p>
        )}

        {/* Linked entities */}
        <div className="mt-auto pt-2">
          {hero.linkedEntities.length === 0 ? (
            <p className="text-xs italic text-muted-foreground">
              Not linked to any content
            </p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {hero.linkedEntities.map((e) => (
                <Link
                  key={`${e.type}-${e.id}`}
                  href={`/admin/content/${e.type === 'course' ? 'courses' : e.type === 'page' ? 'pages' : 'page-indexes'}/${e.id}`}
                >
                  <Badge
                    variant="outline"
                    className="text-[10px] cursor-pointer hover:bg-accent"
                  >
                    {typeLabel[e.type]}: {e.title}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-border flex items-center justify-between gap-2">
        <Link href={`/admin/content/heroes/${hero.id}`}>
          <Button type="button" variant="ghost" size="sm">
            Edit
          </Button>
        </Link>
      </div>
    </div>
  )
}

export function HeroesSection({ heroes }: HeroesSectionProps) {
  if (heroes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          No heroes yet
        </p>
        <p className="text-xs text-muted-foreground">
          Heroes are created from the Hero tab inside each Course, Page, or Page
          Route.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {heroes.map((hero) => (
        <HeroCard key={hero.id} hero={hero} />
      ))}
    </div>
  )
}
