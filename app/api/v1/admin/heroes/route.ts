import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler } from '@/server/api'
import { keystoneContext } from '@/server/keystone/context'

async function listHeroesHandler(_req: NextRequest): Promise<NextResponse> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = keystoneContext.sudo() as any
  const [heroes, linkedCourses, linkedPages, linkedPageIndexes] =
    await Promise.all([
      ctx.query.Hero.findMany({
        orderBy: [{ name: 'asc' }],
        query: 'id name heroTitle heroEyebrow heroBackgroundImage',
      }),
      ctx.query.Course.findMany({
        where: { hero: { id: { not: null } } },
        query: 'hero { id }',
      }),
      ctx.query.Page.findMany({
        where: { hero: { id: { not: null } } },
        query: 'hero { id }',
      }),
      ctx.query.PageIndex.findMany({
        where: { hero: { id: { not: null } } },
        query: 'hero { id }',
      }),
    ])

  const countMap = new Map<string, number>()
  for (const item of [
    ...linkedCourses,
    ...linkedPages,
    ...linkedPageIndexes,
  ] as Array<{ hero: { id: string } }>) {
    const id = item.hero?.id
    if (id) countMap.set(id, (countMap.get(id) ?? 0) + 1)
  }

  const result = (
    heroes as Array<{
      id: string
      name?: string | null
      heroTitle?: string | null
      heroEyebrow?: string | null
      heroBackgroundImage?: string | null
    }>
  ).map((h) => ({
    ...h,
    linkedCount: countMap.get(h.id) ?? 0,
  }))

  return NextResponse.json({ heroes: JSON.parse(JSON.stringify(result)) })
}

const CreateHeroSchema = z.object({
  name: z.string().optional(),
  heroEyebrow: z.string().nullable().optional(),
  heroTitle: z.string().nullable().optional(),
  heroTitleHighlight: z.string().nullable().optional(),
  heroDescription: z.string().nullable().optional(),
  heroCtaLabel: z.string().nullable().optional(),
  heroCtaHref: z.string().nullable().optional(),
  heroSecondaryLabel: z.string().nullable().optional(),
  heroSecondaryHref: z.string().nullable().optional(),
  heroStat1Value: z.string().nullable().optional(),
  heroStat1Label: z.string().nullable().optional(),
  heroStat2Value: z.string().nullable().optional(),
  heroStat2Label: z.string().nullable().optional(),
  heroStat3Value: z.string().nullable().optional(),
  heroStat3Label: z.string().nullable().optional(),
  heroImage: z.string().nullable().optional(),
  heroImageBadgeTitle: z.string().nullable().optional(),
  heroImageBadgeSubtitle: z.string().nullable().optional(),
  heroBackgroundImage: z.string().nullable().optional(),
  heroBackgroundImageMobile: z.string().nullable().optional(),
  heroFullscreen: z.boolean().default(false),
  heroHideGrid: z.boolean().default(false),
})

async function createHeroHandler(req: NextRequest): Promise<NextResponse> {
  const body = await req.json()
  const parsed = CreateHeroSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid input', errors: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hero = await (keystoneContext.sudo() as any).db.Hero.createOne({
    data: {
      name: parsed.data.name ?? '',
      heroEyebrow: parsed.data.heroEyebrow ?? '',
      heroTitle: parsed.data.heroTitle ?? '',
      heroTitleHighlight: parsed.data.heroTitleHighlight ?? '',
      heroDescription: parsed.data.heroDescription ?? '',
      heroCtaLabel: parsed.data.heroCtaLabel ?? '',
      heroCtaHref: parsed.data.heroCtaHref ?? '',
      heroSecondaryLabel: parsed.data.heroSecondaryLabel ?? '',
      heroSecondaryHref: parsed.data.heroSecondaryHref ?? '',
      heroStat1Value: parsed.data.heroStat1Value ?? '',
      heroStat1Label: parsed.data.heroStat1Label ?? '',
      heroStat2Value: parsed.data.heroStat2Value ?? '',
      heroStat2Label: parsed.data.heroStat2Label ?? '',
      heroStat3Value: parsed.data.heroStat3Value ?? '',
      heroStat3Label: parsed.data.heroStat3Label ?? '',
      heroImage: parsed.data.heroImage ?? '',
      heroImageBadgeTitle: parsed.data.heroImageBadgeTitle ?? '',
      heroImageBadgeSubtitle: parsed.data.heroImageBadgeSubtitle ?? '',
      heroBackgroundImage: parsed.data.heroBackgroundImage ?? '',
      heroBackgroundImageMobile: parsed.data.heroBackgroundImageMobile ?? '',
      heroFullscreen: parsed.data.heroFullscreen,
      heroHideGrid: parsed.data.heroHideGrid,
    },
  })

  return NextResponse.json(JSON.parse(JSON.stringify(hero)), { status: 201 })
}

export const GET = apiHandler(listHeroesHandler)
export const POST = apiHandler(createHeroHandler)
