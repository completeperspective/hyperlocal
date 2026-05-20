'use server'

import { keystoneContext } from '@/server/keystone/context'

export interface HeroListItem {
  id: string
  name: string | null
  heroTitle: string | null
  heroEyebrow: string | null
  heroBackgroundImage: string | null
  heroImage: string | null
  linkedCount: number
  linkedEntities: Array<{
    type: 'course' | 'page' | 'page-index'
    id: string
    title: string
    slug: string
  }>
}

export async function getHeroesList(): Promise<HeroListItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = keystoneContext.sudo() as any

  const [heroes, linkedCourses, linkedPages, linkedPageIndexes] =
    await Promise.all([
      ctx.query.Hero.findMany({
        orderBy: [{ name: 'asc' }],
        query: 'id name heroTitle heroEyebrow heroBackgroundImage heroImage',
      }),
      ctx.query.Course.findMany({
        where: { hero: { id: { not: null } } },
        query: 'id title slug hero { id }',
      }),
      ctx.query.Page.findMany({
        where: { hero: { id: { not: null } } },
        query: 'id title slug hero { id }',
      }),
      ctx.query.PageIndex.findMany({
        where: { hero: { id: { not: null } } },
        query: 'id title basePath hero { id }',
      }),
    ])

  type LinkedItem = {
    id: string
    title: string
    slug?: string | null
    basePath?: string | null
    hero: { id: string }
  }
  type HeroRaw = {
    id: string
    name: string | null
    heroTitle: string | null
    heroEyebrow: string | null
    heroBackgroundImage: string | null
    heroImage: string | null
  }

  const coursesByHero = new Map<
    string,
    Array<{ type: 'course'; id: string; title: string; slug: string }>
  >()
  for (const c of linkedCourses as LinkedItem[]) {
    const heroId = c.hero?.id
    if (!heroId) continue
    if (!coursesByHero.has(heroId)) coursesByHero.set(heroId, [])
    coursesByHero.get(heroId)!.push({
      type: 'course',
      id: c.id,
      title: c.title ?? '',
      slug: c.slug ?? '',
    })
  }

  const pagesByHero = new Map<
    string,
    Array<{ type: 'page'; id: string; title: string; slug: string }>
  >()
  for (const p of linkedPages as LinkedItem[]) {
    const heroId = p.hero?.id
    if (!heroId) continue
    if (!pagesByHero.has(heroId)) pagesByHero.set(heroId, [])
    pagesByHero.get(heroId)!.push({
      type: 'page',
      id: p.id,
      title: p.title ?? '',
      slug: p.slug ?? '',
    })
  }

  const pageIndexesByHero = new Map<
    string,
    Array<{ type: 'page-index'; id: string; title: string; slug: string }>
  >()
  for (const pi of linkedPageIndexes as LinkedItem[]) {
    const heroId = pi.hero?.id
    if (!heroId) continue
    if (!pageIndexesByHero.has(heroId)) pageIndexesByHero.set(heroId, [])
    pageIndexesByHero.get(heroId)!.push({
      type: 'page-index',
      id: pi.id,
      title: pi.title ?? '',
      slug: pi.basePath ?? '',
    })
  }

  return (heroes as HeroRaw[]).map((h) => {
    const entities = [
      ...(coursesByHero.get(h.id) ?? []),
      ...(pagesByHero.get(h.id) ?? []),
      ...(pageIndexesByHero.get(h.id) ?? []),
    ]
    return {
      id: h.id,
      name: h.name,
      heroTitle: h.heroTitle,
      heroEyebrow: h.heroEyebrow,
      heroBackgroundImage: h.heroBackgroundImage,
      heroImage: h.heroImage,
      linkedCount: entities.length,
      linkedEntities: entities,
    }
  })
}
