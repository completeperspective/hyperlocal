import { ApiError } from 'next/dist/server/api-utils'
import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/server/api'
import { getSession } from '@/server/auth'
import { toggleLessonComplete } from '@/server/helpers/get-course-progress'
import { keystoneContext } from '@/server/keystone/context'
import { getActiveMemberships } from '@/server/payments/membership'
import { matchesPatterns } from '@/utils/content-access'

async function completeHandler(
  req: NextRequest,
  ctx?: { params?: Promise<unknown> },
) {
  const { data: sessionData } = await getSession()
  if (!sessionData?.id) throw new ApiError(401, 'Unauthorized')

  const params = (await ctx?.params) as { slug: string; 'page-slug': string }
  const { slug, 'page-slug': pageSlug } = params
  const { complete } = (await req.json()) as { complete: boolean }

  const sudoCtx = keystoneContext.sudo()

  const [courses, pages] = await Promise.all([
    sudoCtx.query.Course.findMany({
      where: { slug: { equals: slug } },
      query: 'id status',
      take: 1,
    }),
    sudoCtx.query.Page.findMany({
      where: { slug: { equals: pageSlug } },
      query: 'id status',
      take: 1,
    }),
  ])

  if (!courses.length) throw new ApiError(404, 'Course not found')
  if (!pages.length) throw new ApiError(404, 'Page not found')

  const course = courses[0] as { id: string; status: string }
  const page = pages[0] as { id: string; status: string }

  // Reason: determine which level of the content hierarchy is membership-gated.
  // A lesson-level gate takes precedence over a course-level gate because it is
  // more specific. If neither is gated, skip the membership check entirely so
  // free lessons on a free course are never blocked.
  let pathToCheck: string | null = null
  if (page.status === 'membership') {
    pathToCheck = `/courses/${slug}/${pageSlug}`
  } else if (course.status === 'membership') {
    pathToCheck = `/courses/${slug}`
  }

  if (pathToCheck !== null) {
    // Admins bypass all membership gates.
    if (!sessionData.isAdmin) {
      const activeMemberships = await getActiveMemberships(sessionData.id)

      // Reason: matchesPatterns([], path) returns true (empty = no restriction), which
      // is correct for tier-level semantics but would let membership-less users through.
      if (activeMemberships.length === 0) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Reason: merge all pattern lists across every active membership tier so a
      // user with multiple memberships (e.g. upgrade mid-cycle) always gets the
      // broadest access their tiers allow.
      const mergedPatterns = activeMemberships.flatMap(
        (m) => m.tier?.contentAccessPatterns ?? [],
      )

      if (!matchesPatterns(mergedPatterns, pathToCheck)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
  }

  const { completedAt } = await toggleLessonComplete(
    sessionData.id,
    course.id,
    page.id,
    complete,
  )

  return NextResponse.json({ completedAt })
}

export const PATCH = apiHandler(completeHandler)
