'use server'

import { notFound } from 'next/navigation'
import { getSession } from '@/server/auth'
import { keystoneContext } from '@/server/keystone/context'
import type { CourseData } from '@/types/course'

/** Lightweight check used by the root layout to determine transparent-header eligibility. */
export async function isCourseHeroEnabled(slug: string): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = await (keystoneContext.sudo() as any).query.Course.findMany(
      {
        where: { slug: { equals: slug } },
        query: 'heroEnabled',
        take: 1,
      },
    )
    return results[0]?.heroEnabled === true
  } catch {
    return false
  }
}

export async function getCourseData(slug: string) {
  let notIn = ['draft', 'private']
  const session = await getSession()
  if (session?.data?.isAdmin) {
    notIn = ['draft']
  }

  try {
    // Reason: Course/Chapter lists are new — .keystone/types won't include them
    // until `pnpm keystone:dev` applies the migration. Cast removed once migration runs.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sudoCtx = keystoneContext.sudo() as any
    const req = await sudoCtx.query.Course.findMany({
      where: {
        AND: [{ slug: { equals: slug } }, { status: { notIn } }],
      },
      query: `
        id
        title
        description
        slug
        status
        publishedAt
        metaTitle
        metaDescription
        heroEnabled
        hero {
          id name heroEyebrow heroTitle heroTitleHighlight heroDescription
          heroCtaLabel heroCtaHref heroSecondaryLabel heroSecondaryHref
          heroStat1Value heroStat1Label heroStat2Value heroStat2Label heroStat3Value heroStat3Label
          heroImage heroImageBadgeTitle heroImageBadgeSubtitle
          heroBackgroundImage heroBackgroundImageMobile heroFullscreen heroHideGrid
        }
        theme {
          id
          name
          lightMode
          darkMode
          radius
          fontHeading
          fontBody
        }
        content { document }
        trustedHtml
        customCss
        chapters(orderBy: { sortOrder: asc }) {
          id
          title
          sortOrder
          pages(orderBy: { slug: asc }) {
            id
            title
            slug
            status
          }
        }
        pages(orderBy: { slug: asc }) {
          id
          title
          slug
          status
        }
      `,
    })

    if (req.length === 0) {
      return notFound()
    }

    return JSON.parse(JSON.stringify(req[0])) as CourseData
  } catch (e) {
    console.error(e)
    notFound()
  }
}

export async function getCourseLessonData(
  courseSlug: string,
  pageSlug: string,
) {
  const course = await getCourseData(courseSlug) // reuse existing; handles notFound()
  const session = await getSession()
  let notIn = ['draft', 'private']
  if (session?.data?.isAdmin) {
    notIn = ['draft']
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sudoCtx = keystoneContext.sudo() as any
  const pages = await sudoCtx.query.Page.findMany({
    where: {
      slug: { equals: pageSlug },
      status: { notIn },
    },
    query: `
      id title description slug status
      heroEnabled
      hero {
        id name heroEyebrow heroTitle heroTitleHighlight heroDescription
        heroCtaLabel heroCtaHref heroSecondaryLabel heroSecondaryHref
        heroStat1Value heroStat1Label heroStat2Value heroStat2Label heroStat3Value heroStat3Label
        heroImage heroImageBadgeTitle heroImageBadgeSubtitle
        heroBackgroundImage heroBackgroundImageMobile heroFullscreen heroHideGrid
      }
      content { document } trustedHtml customCss
      attachments { id publicUrl filename mimeType bytes }
    `,
    take: 1,
  })
  return { course, page: pages[0] ?? null }
}
