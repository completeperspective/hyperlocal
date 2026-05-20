import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GetAccessClient } from '~/app/(public)/get-access/get-access-client'
import { getSession } from '@/server/auth'
import {
  AppSettings,
  getCourseData,
  getLessonProgressMap,
  getPageMetadata,
} from '@/server/helpers'
import { CoursePageRenderer } from '@/server/pages/course-page'
import {
  getActiveMemberships,
  getActiveMembershipTiers,
} from '@/server/payments/membership'
import type { LessonProgressMap } from '@/types/course'
import { GatedContentCallout } from '@/ui/gated-content-callout'
import { ScopedThemeWrapper } from '@/ui/scoped-theme-wrapper'
import { matchesPatterns } from '@/utils/content-access'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const course = await getCourseData(slug)
  return await getPageMetadata(course)
}

export default async function CourseSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const appSettings = await AppSettings.instance.settings()
  const { data: sessionData } = await getSession()
  const isAuthenticated = !!sessionData

  if (appSettings?.isPrivate && !isAuthenticated) {
    return notFound()
  }

  const courseData = await getCourseData(slug)

  // Always resolve memberships so the TOC can show lock icons on individual
  // membership pages even when the course itself is not gated.
  const activeMemberships = sessionData?.id
    ? await getActiveMemberships(sessionData.id)
    : []
  const hasActiveMembership = activeMemberships.length > 0

  if (courseData?.status === 'membership') {
    // Reason: admins bypass all membership gates regardless of their own membership status.
    if (!sessionData?.isAdmin) {
      if (!hasActiveMembership) {
        const tiers = await getActiveMembershipTiers()
        return (
          <main className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-8">
            <GetAccessClient
              returnTo={`/courses/${slug}`}
              tiers={tiers}
              allowWeb3Auth={appSettings?.allowWeb3Auth ?? false}
              allowSignup={appSettings?.allowSignup ?? false}
              signinMessage={appSettings?.web3SignInMessage ?? undefined}
              isAuthenticated={isAuthenticated}
              walletAddress={sessionData?.walletAddress ?? null}
              receiverWalletAddress={appSettings?.receiverWalletAddress ?? null}
            />
          </main>
        )
      } else {
        // Reason: union all active tier patterns so users with multiple memberships get combined access.
        const mergedPatterns = activeMemberships.flatMap(
          (m) => m.tier?.contentAccessPatterns ?? [],
        )
        const currentPath = `/courses/${slug}`
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
                upgradeHref={`/get-access?returnTo=${encodeURIComponent(currentPath)}`}
              />
            </main>
          )
        }
      }
    }
  }

  let progressMap: LessonProgressMap = {}
  if (sessionData?.id && courseData?.id) {
    progressMap = await getLessonProgressMap(sessionData.id, courseData.id)
  }

  // Skip outer <main> when hero is present or trustedHtml supplies its own layout root
  const skipWrapper = courseData.heroEnabled || !!courseData.trustedHtml

  if (skipWrapper) {
    return (
      <ScopedThemeWrapper theme={courseData.theme ?? null} global>
        <CoursePageRenderer
          courseData={courseData}
          isAuthenticated={isAuthenticated}
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
          isAuthenticated={isAuthenticated}
          progressMap={progressMap}
          hasActiveMembership={hasActiveMembership}
        />
      </main>
    </ScopedThemeWrapper>
  )
}
