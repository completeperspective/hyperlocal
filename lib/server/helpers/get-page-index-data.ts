'use server'

import { getSession } from '@/server/auth'
import { keystoneContext } from '@/server/keystone/context'
import type { PageData } from '@/types'
import type { PageIndexData } from '@/types/page-index'

const PAGE_INDEX_QUERY = `
  id title slug basePath status publishedAt
  metaTitle metaDescription groupsLabel
  ogImage { id title source { publicUrl } }
  content { document }
  trustedHtml customCss
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
  pages(orderBy: { slug: asc }) { id title slug status }
  groups(orderBy: { sortOrder: asc }) {
    id title sortOrder
    pages(orderBy: { slug: asc }) { id title slug status }
  }
`

export async function getPageIndexData(
  basePath: string,
  slug: string,
): Promise<PageIndexData | null> {
  let notIn = ['draft', 'private']
  const session = await getSession()
  if (session?.data?.isAdmin) notIn = ['draft']

  try {
    const results = await keystoneContext.sudo().query.PageIndex.findMany({
      where: {
        AND: [
          { slug: { equals: slug } },
          { basePath: { equals: basePath } },
          { status: { notIn } },
        ],
      },
      query: PAGE_INDEX_QUERY,
    })
    if (results.length === 0) return null
    return JSON.parse(JSON.stringify(results[0])) as PageIndexData
  } catch {
    return null
  }
}

export async function getPageInIndex(
  indexData: PageIndexData,
  pageSlug: string,
): Promise<PageData | null> {
  let notIn = ['draft', 'private']
  const session = await getSession()
  if (session?.data?.isAdmin) notIn = ['draft']

  // Verify the page slug is actually part of this index
  const directSlugs = indexData.pages.map((p) => p.slug)
  const groupedSlugs = indexData.groups.flatMap((g) =>
    g.pages.map((p) => p.slug),
  )
  const allSlugs = [...new Set([...directSlugs, ...groupedSlugs])]
  if (!allSlugs.includes(pageSlug)) return null

  try {
    const results = await keystoneContext.sudo().query.Page.findMany({
      where: {
        AND: [{ slug: { equals: pageSlug } }, { status: { notIn } }],
      },
      query: `
        id title description slug status publishedAt
        content { document }
        trustedHtml customCss
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
        attachments { id title filename mimeType format bytes }
      `,
      take: 1,
    })
    return (results[0] ?? null) as PageData | null
  } catch {
    return null
  }
}
