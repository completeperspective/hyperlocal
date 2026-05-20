import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/server/auth'
import {
  AppSettings,
  getPageIndexData,
  getPageInIndex,
  getPageMetadata,
} from '@/server/helpers'
import { DynamicPage } from '@/server/pages/dynamic-page'
import { PageIndexPageRenderer } from '@/server/pages/page-index-page'
import {
  getActiveMemberships,
  getActiveMembershipTiers,
} from '@/server/payments/membership'
import type { PageData } from '@/types'
import { buildHeroConfig } from '@/types/course'
import type { PageIndexData } from '@/types/page-index'
import { GatedContentCallout } from '@/ui/gated-content-callout'
import { Hero } from '@/ui/hero'
import { ScopedThemeWrapper } from '@/ui/scoped-theme-wrapper'
import { matchesPatterns } from '@/utils/content-access'

interface PageProps {
  params: Promise<{ path: string[] }>
}

type RouteResult =
  | { mode: 'page'; indexData: PageIndexData; pageData: PageData }
  | { mode: 'index'; indexData: PageIndexData; pageData: null }
  | { mode: 'not-found'; indexData: null; pageData: null }

async function resolveRoute(path: string[]): Promise<RouteResult> {
  // Attempt 1 — page mode: last = pageSlug, second-to-last = indexSlug, rest = basePath
  if (path.length >= 2) {
    const pageSlug = path[path.length - 1]
    const indexSlug = path[path.length - 2]
    const basePath = path.slice(0, -2).join('/')
    const indexData = await getPageIndexData(basePath, indexSlug)
    if (indexData) {
      const pageData = await getPageInIndex(indexData, pageSlug)
      if (pageData) {
        return { mode: 'page', indexData, pageData: pageData as PageData }
      }
    }
  }

  // Attempt 2 — index mode: last = indexSlug, rest = basePath
  const indexSlug = path[path.length - 1]
  const basePath = path.slice(0, -1).join('/')
  const indexData = await getPageIndexData(basePath, indexSlug)
  if (indexData) return { mode: 'index', indexData, pageData: null }

  return { mode: 'not-found', indexData: null, pageData: null }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { path } = await params
  const result = await resolveRoute(path)
  if (!result.indexData) return {}
  const target =
    result.mode === 'page' && result.pageData
      ? result.pageData
      : result.indexData
  return getPageMetadata(target as Parameters<typeof getPageMetadata>[0])
}

export default async function CatchAllPage({ params }: PageProps) {
  const { path } = await params
  const appSettings = await AppSettings.instance.settings()
  const { data: sessionData } = await getSession()
  const isAuthenticated = !!sessionData

  if (appSettings?.isPrivate && !isAuthenticated) return notFound()

  const result = await resolveRoute(path)

  if (result.mode === 'not-found' || !result.indexData) return notFound()

  const { indexData, pageData } = result
  const currentPath = `/${path.join('/')}`

  // Resolve memberships for gating and lock icons
  const activeMemberships = sessionData?.id
    ? await getActiveMemberships(sessionData.id)
    : []
  const hasActiveMembership = activeMemberships.length > 0
  const isAdmin = sessionData?.isAdmin ?? false

  // Gate on index-level status
  if (indexData.status === 'membership' && !isAdmin) {
    if (!hasActiveMembership) {
      redirect(`/get-access?returnTo=${encodeURIComponent(currentPath)}`)
    }
    // Check tier patterns cover this URL
    const mergedPatterns = activeMemberships.flatMap(
      (m) => m.tier?.contentAccessPatterns ?? [],
    )
    const indexPath = indexData.basePath
      ? `/${indexData.basePath}/${indexData.slug}`
      : `/${indexData.slug}`
    if (!matchesPatterns(mergedPatterns, indexPath)) {
      const allTiers = await getActiveMembershipTiers()
      const grantingTiers = allTiers.filter((t) =>
        matchesPatterns(t.contentAccessPatterns, indexPath),
      )
      return (
        <main className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-8">
          <GatedContentCallout
            contentTitle={indexData.title}
            requiredTiers={grantingTiers.map((t) => ({
              id: t.id,
              name: t.name,
            }))}
            currentTierName={
              activeMemberships
                .map((m) => m.tier?.name)
                .filter(Boolean)
                .join(', ') || undefined
            }
            isAuthenticated={true}
            upgradeHref={`/get-access?returnTo=${encodeURIComponent(currentPath)}`}
          />
        </main>
      )
    }
  }

  // Gate on page-level status (only relevant in page mode)
  if (
    result.mode === 'page' &&
    pageData &&
    (pageData as { status?: string }).status === 'membership' &&
    !isAdmin
  ) {
    if (!hasActiveMembership) {
      redirect(`/get-access?returnTo=${encodeURIComponent(currentPath)}`)
    }
    const mergedPatterns = activeMemberships.flatMap(
      (m) => m.tier?.contentAccessPatterns ?? [],
    )
    if (!matchesPatterns(mergedPatterns, currentPath)) {
      const allTiers = await getActiveMembershipTiers()
      const grantingTiers = allTiers.filter((t) =>
        matchesPatterns(t.contentAccessPatterns, currentPath),
      )
      return (
        <main className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-8">
          <GatedContentCallout
            contentTitle={
              (pageData as { title?: string }).title ?? path[path.length - 1]
            }
            requiredTiers={grantingTiers.map((t) => ({
              id: t.id,
              name: t.name,
            }))}
            currentTierName={
              activeMemberships
                .map((m) => m.tier?.name)
                .filter(Boolean)
                .join(', ') || undefined
            }
            isAuthenticated={true}
            upgradeHref={`/get-access?returnTo=${encodeURIComponent(currentPath)}`}
          />
        </main>
      )
    }
  }

  // Render individual page
  // Reason: hero is rendered here (not inside DynamicPage) so that it is
  // always full-bleed against ScopedThemeWrapper, and never rendered twice.
  if (result.mode === 'page' && pageData) {
    const heroConfig =
      pageData.heroEnabled && pageData.hero
        ? buildHeroConfig(pageData.hero)
        : null
    const indexCss = indexData.customCss
    return (
      <ScopedThemeWrapper theme={indexData.theme ?? null} global>
        {heroConfig && <Hero config={heroConfig} />}
        <main className="container-content section-normal">
          {indexCss && <style dangerouslySetInnerHTML={{ __html: indexCss }} />}
          <DynamicPage pageData={pageData as PageData} />
        </main>
      </ScopedThemeWrapper>
    )
  }

  // Render index landing
  return (
    <ScopedThemeWrapper theme={indexData.theme ?? null} global>
      <PageIndexPageRenderer
        indexData={indexData}
        isAuthenticated={isAuthenticated}
        hasActiveMembership={hasActiveMembership}
      />
    </ScopedThemeWrapper>
  )
}
