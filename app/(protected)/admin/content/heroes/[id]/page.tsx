import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getHeroesList } from '@/server/helpers/get-heroes-list'
import { keystoneContext } from '@/server/keystone/context'
import type { HeroData } from '@/types/hero'
import { HeroDetailClient } from './hero-detail-client'

const HERO_QUERY = `
  id name heroEyebrow heroTitle heroTitleHighlight heroDescription
  heroCtaLabel heroCtaHref heroSecondaryLabel heroSecondaryHref
  heroStat1Value heroStat1Label heroStat2Value heroStat2Label heroStat3Value heroStat3Label
  heroImage heroImageBadgeTitle heroImageBadgeSubtitle
  heroBackgroundImage heroBackgroundImageMobile heroFullscreen heroHideGrid
`

export async function generateMetadata(props: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await props.params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await (keystoneContext.sudo() as any).query.Hero.findOne({
    where: { id },
    query: 'name heroTitle',
  })
  const label =
    (raw?.name as string | null) ?? (raw?.heroTitle as string | null) ?? 'Hero'
  return { title: `${label} — Hero` }
}

export default async function HeroDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await (keystoneContext.sudo() as any).query.Hero.findOne({
    where: { id },
    query: HERO_QUERY,
  })

  if (!raw) notFound()

  const hero = JSON.parse(JSON.stringify(raw)) as HeroData

  const heroesList = await getHeroesList()
  const heroEntry = heroesList.find((h) => h.id === id)
  const linkedEntities = heroEntry?.linkedEntities ?? []

  const displayName = hero.name || hero.heroTitle || 'Untitled Hero'

  return (
    <HeroDetailClient
      hero={hero}
      displayName={displayName}
      linkedEntities={linkedEntities}
    />
  )
}
