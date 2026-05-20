import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { keystoneContext } from '@/server/keystone/context'
import type { PageData } from '@/types/page'
import type { ThemeSummary } from '@/ui/theme-selector'
import { PageDetailLayout } from './components/page-detail-layout'

export async function generateMetadata(props: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await props.params
  const raw = await keystoneContext.sudo().query.Page.findOne({
    where: { id },
    query: 'title',
  })
  return { title: raw ? `${raw.title} — Page` : 'Page' }
}

export default async function PageDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params

  const [raw, allThemes] = await Promise.all([
    keystoneContext.sudo().query.Page.findOne({
      where: { id },
      query: `
        id title slug description status publishedAt metaTitle metaDescription trustedHtml customCss heroEnabled
        ogImage { id title source { publicUrl } }
        hero {
          id name heroEyebrow heroTitle heroTitleHighlight heroDescription
          heroCtaLabel heroCtaHref heroSecondaryLabel heroSecondaryHref
          heroStat1Value heroStat1Label heroStat2Value heroStat2Label heroStat3Value heroStat3Label
          heroImage heroImageBadgeTitle heroImageBadgeSubtitle
          heroBackgroundImage heroBackgroundImageMobile heroFullscreen heroHideGrid
        }
        theme { id name lightMode darkMode radius fontHeading fontBody }
      `,
    }),
    (
      keystoneContext.sudo().db as unknown as {
        Theme: { findMany: (opts: unknown) => Promise<unknown[]> }
      }
    ).Theme.findMany({ orderBy: [{ name: 'asc' }] }),
  ])

  if (!raw) notFound()

  const data = JSON.parse(JSON.stringify(raw)) as PageData

  return (
    <PageDetailLayout
      data={data}
      themes={allThemes as ThemeSummary[]}
      initialThemeId={data.theme?.id ?? null}
    />
  )
}
