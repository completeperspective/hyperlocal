import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler } from '@/server/api'
import { keystoneContext } from '@/server/keystone/context'

const PatchHeroSchema = z.object({
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
  heroFullscreen: z.boolean().optional(),
  heroHideGrid: z.boolean().optional(),
})

const HERO_QUERY = `
  id name heroEyebrow heroTitle heroTitleHighlight heroDescription
  heroCtaLabel heroCtaHref heroSecondaryLabel heroSecondaryHref
  heroStat1Value heroStat1Label heroStat2Value heroStat2Label heroStat3Value heroStat3Label
  heroImage heroImageBadgeTitle heroImageBadgeSubtitle
  heroBackgroundImage heroBackgroundImageMobile heroFullscreen heroHideGrid
`

async function getHeroHandler(
  _req: NextRequest,
  ctx?: { params?: Promise<unknown> },
): Promise<NextResponse> {
  const { id } = (await ctx?.params) as { id: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await (keystoneContext.sudo() as any).query.Hero.findOne({
    where: { id },
    query: HERO_QUERY,
  })
  if (!raw)
    return NextResponse.json({ message: 'Hero not found' }, { status: 404 })
  return NextResponse.json(JSON.parse(JSON.stringify(raw)))
}

async function updateHeroHandler(
  req: NextRequest,
  ctx?: { params?: Promise<unknown> },
): Promise<NextResponse> {
  const { id } = (await ctx?.params) as { id: string }
  const body = await req.json()
  const parsed = PatchHeroSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid input', errors: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ksCtx = keystoneContext.sudo() as any
  const existing = await ksCtx.db.Hero.findOne({ where: { id } })
  if (!existing)
    return NextResponse.json({ message: 'Hero not found' }, { status: 404 })

  const data: Record<string, unknown> = {}
  const d = parsed.data
  if (d.name !== undefined) data.name = d.name
  if (d.heroEyebrow !== undefined) data.heroEyebrow = d.heroEyebrow ?? ''
  if (d.heroTitle !== undefined) data.heroTitle = d.heroTitle ?? ''
  if (d.heroTitleHighlight !== undefined)
    data.heroTitleHighlight = d.heroTitleHighlight ?? ''
  if (d.heroDescription !== undefined)
    data.heroDescription = d.heroDescription ?? ''
  if (d.heroCtaLabel !== undefined) data.heroCtaLabel = d.heroCtaLabel ?? ''
  if (d.heroCtaHref !== undefined) data.heroCtaHref = d.heroCtaHref ?? ''
  if (d.heroSecondaryLabel !== undefined)
    data.heroSecondaryLabel = d.heroSecondaryLabel ?? ''
  if (d.heroSecondaryHref !== undefined)
    data.heroSecondaryHref = d.heroSecondaryHref ?? ''
  if (d.heroStat1Value !== undefined)
    data.heroStat1Value = d.heroStat1Value ?? ''
  if (d.heroStat1Label !== undefined)
    data.heroStat1Label = d.heroStat1Label ?? ''
  if (d.heroStat2Value !== undefined)
    data.heroStat2Value = d.heroStat2Value ?? ''
  if (d.heroStat2Label !== undefined)
    data.heroStat2Label = d.heroStat2Label ?? ''
  if (d.heroStat3Value !== undefined)
    data.heroStat3Value = d.heroStat3Value ?? ''
  if (d.heroStat3Label !== undefined)
    data.heroStat3Label = d.heroStat3Label ?? ''
  if (d.heroImage !== undefined) data.heroImage = d.heroImage ?? ''
  if (d.heroImageBadgeTitle !== undefined)
    data.heroImageBadgeTitle = d.heroImageBadgeTitle ?? ''
  if (d.heroImageBadgeSubtitle !== undefined)
    data.heroImageBadgeSubtitle = d.heroImageBadgeSubtitle ?? ''
  if (d.heroBackgroundImage !== undefined)
    data.heroBackgroundImage = d.heroBackgroundImage ?? ''
  if (d.heroBackgroundImageMobile !== undefined)
    data.heroBackgroundImageMobile = d.heroBackgroundImageMobile ?? ''
  if (d.heroFullscreen !== undefined) data.heroFullscreen = d.heroFullscreen
  if (d.heroHideGrid !== undefined) data.heroHideGrid = d.heroHideGrid

  await ksCtx.db.Hero.updateOne({ where: { id }, data })
  return NextResponse.json({ updated: true })
}

async function deleteHeroHandler(
  _req: NextRequest,
  ctx?: { params?: Promise<unknown> },
): Promise<NextResponse> {
  const { id } = (await ctx?.params) as { id: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ksCtx = keystoneContext.sudo() as any
  const existing = await ksCtx.db.Hero.findOne({ where: { id } })
  if (!existing)
    return NextResponse.json({ message: 'Hero not found' }, { status: 404 })
  await ksCtx.db.Hero.deleteOne({ where: { id } })
  return new NextResponse(null, { status: 204 })
}

export const GET = apiHandler(getHeroHandler)
export const PATCH = apiHandler(updateHeroHandler)
export const DELETE = apiHandler(deleteHeroHandler)
