import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { keystoneContext } from '@/server/keystone/context'
import type { PageIndexData } from '@/types/page-index'
import type { ThemeSummary } from '@/ui/theme-selector'
import { PageIndexDetailLayout } from './components/page-index-detail-layout'

export async function generateMetadata(props: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await props.params
  const raw = await keystoneContext.sudo().query.PageIndex.findOne({
    where: { id },
    query: 'title',
  })
  return { title: raw ? `${raw.title as string} — Page Index` : 'Page Index' }
}

export default async function PageIndexDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params

  const [raw, allThemes] = await Promise.all([
    keystoneContext.sudo().query.PageIndex.findOne({
      where: { id },
      query: `
        id title slug basePath status publishedAt heroEnabled
        metaTitle metaDescription trustedHtml customCss
        ogImage { id title source { publicUrl } }
        hero {
          id name heroEyebrow heroTitle heroTitleHighlight heroDescription
          heroCtaLabel heroCtaHref heroSecondaryLabel heroSecondaryHref
          heroStat1Value heroStat1Label heroStat2Value heroStat2Label heroStat3Value heroStat3Label
          heroImage heroImageBadgeTitle heroImageBadgeSubtitle
          heroBackgroundImage heroBackgroundImageMobile heroFullscreen heroHideGrid
        }
        theme { id name lightMode darkMode radius fontHeading fontBody }
        pages(orderBy: { slug: asc }) { id title slug status }
        groups(orderBy: { sortOrder: asc }) {
          id title sortOrder
          pages(orderBy: { slug: asc }) { id title slug status }
        }
      `,
    }),
    (
      keystoneContext.sudo().db as unknown as {
        Theme: { findMany: (opts: unknown) => Promise<unknown[]> }
      }
    ).Theme.findMany({ orderBy: [{ name: 'asc' }] }),
  ])

  if (!raw) notFound()

  const data = JSON.parse(JSON.stringify(raw)) as PageIndexData

  return (
    <PageIndexDetailLayout
      data={data}
      themes={allThemes as ThemeSummary[]}
      initialThemeId={data.theme?.id ?? null}
    />
  )
}
