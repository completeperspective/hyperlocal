import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { LandingPage } from '~/lib/server/pages/landing-page'
import { getSession, isAuthenticated } from '@/server/auth'
import {
  AppSettings,
  getCourseData,
  getLessonProgressMap,
  getPageData,
  getPageIndexData,
  getPageMetadata,
} from '@/server/helpers'
import { CoursePageRenderer } from '@/server/pages/course-page'
import { DynamicPage } from '@/server/pages/dynamic-page'
import { PageIndexPageRenderer } from '@/server/pages/page-index-page'
import {
  getActiveMemberships,
  getActiveMembershipTiers,
} from '@/server/payments/membership'
import { GatedContentCallout } from '@/ui/gated-content-callout'
import { ScopedThemeWrapper } from '@/ui/scoped-theme-wrapper'
import { matchesPatterns } from '@/utils/content-access'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await AppSettings.instance.settings()

  if (settings?.rootCourse?.slug) {
    try {
      const course = await getCourseData(settings.rootCourse.slug)
      return await getPageMetadata(course)
    } catch {
      return await getPageMetadata('Home')
    }
  }

  if (settings?.rootPageIndex) {
    try {
      const { slug, basePath } = settings.rootPageIndex
      const indexData = await getPageIndexData(basePath ?? '', slug)
      return await getPageMetadata(indexData || 'Home')
    } catch {
      return await getPageMetadata('Home')
    }
  }

  try {
    const page = await getPageData(settings?.homePage.slug as string)
    return await getPageMetadata(page || 'Home')
  } catch {
    return await getPageMetadata('Home')
  }
}

export default async function PublicLanding() {
  const appSettings = await AppSettings.instance.settings()
  const isAuth = await isAuthenticated()

  if (appSettings?.isPrivate && !isAuth) {
    redirect('/login')
  }

  // Course wins over homePage when both are configured — render inline at /
  if (appSettings?.rootCourse?.slug) {
    const { data: sessionData } = await getSession()
    const courseData = await getCourseData(appSettings.rootCourse.slug)

    if (!courseData) return notFound()

    // Always resolve memberships so the TOC can show lock icons on individual
    // membership pages even when the course itself is not gated.
    const activeMemberships = sessionData?.id
      ? await getActiveMemberships(sessionData.id)
      : []
    const hasActiveMembership = activeMemberships.length > 0

    if (courseData.status === 'membership') {
      // Reason: admins bypass all membership gates regardless of their own membership status.
      if (!sessionData?.isAdmin) {
        if (!hasActiveMembership) {
          return redirect(`/get-access?returnTo=${encodeURIComponent('/')}`)
        }

        // Reason: union all active tier patterns so users with multiple memberships get combined access.
        const mergedPatterns = activeMemberships.flatMap(
          (m) => m.tier?.contentAccessPatterns ?? [],
        )
        const currentPath = `/courses/${appSettings.rootCourse!.slug}`
        if (!matchesPatterns(mergedPatterns, currentPath)) {
          const allTiers = await getActiveMembershipTiers()
          const grantingTiers = allTiers.filter((t) =>
            matchesPatterns(t.contentAccessPatterns, currentPath),
          )
          return (
            <main className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-8">
              <GatedContentCallout
                contentTitle={courseData.title}
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
                upgradeHref={`/get-access?returnTo=${encodeURIComponent('/')}`}
              />
            </main>
          )
        }
      }
    }

    const isAuthForCourse = !!sessionData
    let progressMap = {}
    if (sessionData?.id && courseData.id) {
      progressMap = await getLessonProgressMap(sessionData.id, courseData.id)
    }

    const skipWrapper = courseData.heroEnabled || !!courseData.trustedHtml
    if (skipWrapper) {
      return (
        <ScopedThemeWrapper theme={courseData.theme ?? null} global>
          <CoursePageRenderer
            courseData={courseData}
            isAuthenticated={isAuthForCourse}
            progressMap={progressMap}
            hasActiveMembership={hasActiveMembership}
          />
        </ScopedThemeWrapper>
      )
    }
    return (
      <ScopedThemeWrapper theme={courseData.theme ?? null} global>
        <main className="flex min-h-screen w-full flex-col section-normal bg-transparent">
          <CoursePageRenderer
            courseData={courseData}
            isAuthenticated={isAuthForCourse}
            progressMap={progressMap}
            hasActiveMembership={hasActiveMembership}
          />
        </main>
      </ScopedThemeWrapper>
    )
  }

  // Root page index — render inline at / (same gating as [...path]/page.tsx)
  if (appSettings?.rootPageIndex) {
    const { slug, basePath } = appSettings.rootPageIndex
    const indexData = await getPageIndexData(basePath ?? '', slug)

    if (indexData) {
      const { data: sessionData } = await getSession()
      const activeMemberships = sessionData?.id
        ? await getActiveMemberships(sessionData.id)
        : []
      const hasActiveMembership = activeMemberships.length > 0
      const isAdminUser = sessionData?.isAdmin ?? false

      if (indexData.status === 'membership' && !isAdminUser) {
        if (!hasActiveMembership) {
          redirect(`/get-access?returnTo=${encodeURIComponent('/')}`)
        }
        const mergedPatterns = activeMemberships.flatMap(
          (m) => m.tier?.contentAccessPatterns ?? [],
        )
        const indexPath = basePath ? `/${basePath}/${slug}` : `/${slug}`
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
                upgradeHref={`/get-access?returnTo=${encodeURIComponent('/')}`}
              />
            </main>
          )
        }
      }

      return (
        <ScopedThemeWrapper theme={indexData.theme ?? null} global>
          <main className="flex min-h-screen w-full flex-col bg-transparent">
            <PageIndexPageRenderer
              indexData={indexData}
              isAuthenticated={!!sessionData}
              hasActiveMembership={hasActiveMembership}
            />
          </main>
        </ScopedThemeWrapper>
      )
    }
  }

  let pageData = null
  if (appSettings?.homePage) {
    // Reason: Only catch data-fetch failures from getPageData — membership redirects
    // and JSX returns must propagate out of the catch block. We fetch first, then
    // apply gating logic outside the try so redirect() throws are not swallowed.
    try {
      pageData = await getPageData(appSettings?.homePage.slug)
    } catch {
      return <LandingPage />
    }

    if (pageData?.status === 'membership') {
      if (!isAuth) {
        return redirect('/login')
      }

      // Live DB check — do not trust session cache for a payment gate
      const { data: homeSessionData } = await getSession()

      // Reason: admins bypass all membership gates regardless of their own membership status.
      if (!homeSessionData?.isAdmin) {
        const homeActiveMemberships = homeSessionData?.id
          ? await getActiveMemberships(homeSessionData.id)
          : []

        if (homeActiveMemberships.length === 0) {
          return redirect(
            `/dashboard?upgrade=1&returnTo=${encodeURIComponent('/')}`,
          )
        }

        // Reason: union all active tier patterns so users with multiple memberships get combined access.
        const homeMergedPatterns = homeActiveMemberships.flatMap(
          (m) => m.tier?.contentAccessPatterns ?? [],
        )
        const currentPath = `/${pageData.slug}`
        if (!matchesPatterns(homeMergedPatterns, currentPath)) {
          const allTiers = await getActiveMembershipTiers()
          const grantingTiers = allTiers.filter((t) =>
            matchesPatterns(t.contentAccessPatterns, currentPath),
          )
          return (
            <main className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-8">
              <GatedContentCallout
                contentTitle={pageData.title ?? pageData.slug}
                requiredTiers={grantingTiers.map((t) => ({
                  id: t.id,
                  name: t.name,
                }))}
                currentTierName={
                  homeActiveMemberships
                    .map((m) => m.tier?.name)
                    .filter(Boolean)
                    .join(', ') || undefined
                }
                isAuthenticated={true}
                upgradeHref={`/get-access?returnTo=${encodeURIComponent('/')}`}
              />
            </main>
          )
        }
      }
    }
  }

  if (pageData) {
    return (
      <div className="container-content section-normal">
        <DynamicPage pageData={pageData} />
      </div>
    )
  } else {
    return <LandingPage />
  }
}

export const dynamic = 'force-dynamic'
