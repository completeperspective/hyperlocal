import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler } from '@/server/api'
import { keystoneContext } from '@/server/keystone/context'

const PatchPageSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'private', 'membership', 'published']).optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  ogImageId: z.string().nullable().optional(),
  trustedHtml: z.string().nullable().optional(),
  customCss: z.string().nullable().optional(),
  heroId: z.string().nullable().optional(),
  heroEnabled: z.boolean().optional(),
  themeId: z.string().nullable().optional(),
})

const HERO_QUERY = `
  heroEnabled
  hero {
    id name heroEyebrow heroTitle heroTitleHighlight heroDescription
    heroCtaLabel heroCtaHref heroSecondaryLabel heroSecondaryHref
    heroStat1Value heroStat1Label heroStat2Value heroStat2Label heroStat3Value heroStat3Label
    heroImage heroImageBadgeTitle heroImageBadgeSubtitle
    heroBackgroundImage heroBackgroundImageMobile heroFullscreen heroHideGrid
  }
`

async function getPageHandler(
  _req: NextRequest,
  ctx?: { params?: Promise<unknown> },
): Promise<NextResponse> {
  const { id } = (await ctx?.params) as { id: string }

  const ksCtx = keystoneContext.sudo()
  const raw = await ksCtx.query.Page.findOne({
    where: { id },
    query: `
      id title slug description status publishedAt
      metaTitle metaDescription
      ogImage { id title source { publicUrl } }
      ${HERO_QUERY}
      theme { id name }
    `,
  })

  if (!raw) {
    return NextResponse.json({ message: 'Page not found' }, { status: 404 })
  }

  // Reason: Keystone returns a Proxy object; JSON round-trip strips the proxy
  // so plain objects are returned to the client.
  return NextResponse.json(JSON.parse(JSON.stringify(raw)))
}

async function updatePageHandler(
  req: NextRequest,
  ctx?: { params?: Promise<unknown> },
): Promise<NextResponse> {
  const { id } = (await ctx?.params) as { id: string }
  const body = await req.json()
  const parsed = PatchPageSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid input', errors: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const ksCtx = keystoneContext.sudo()

  const existing = await ksCtx.db.Page.findOne({ where: { id } })
  if (!existing) {
    return NextResponse.json({ message: 'Page not found' }, { status: 404 })
  }

  const updateData = {
    ...(parsed.data.title !== undefined && { title: parsed.data.title }),
    ...(parsed.data.slug !== undefined && { slug: parsed.data.slug }),
    ...(parsed.data.description !== undefined && {
      description: parsed.data.description,
    }),
    ...(parsed.data.status !== undefined && { status: parsed.data.status }),
    ...(parsed.data.metaTitle !== undefined && {
      metaTitle: parsed.data.metaTitle ?? '',
    }),
    ...(parsed.data.metaDescription !== undefined && {
      metaDescription: parsed.data.metaDescription ?? '',
    }),
    ...(parsed.data.ogImageId !== undefined && {
      ogImage: parsed.data.ogImageId
        ? { connect: { id: parsed.data.ogImageId } }
        : { disconnect: true },
    }),
    ...(parsed.data.trustedHtml !== undefined && {
      trustedHtml: parsed.data.trustedHtml ?? '',
    }),
    ...(parsed.data.customCss !== undefined && {
      customCss: parsed.data.customCss ?? '',
    }),
    ...(parsed.data.heroId !== undefined && {
      hero: parsed.data.heroId
        ? { connect: { id: parsed.data.heroId } }
        : { disconnect: true },
    }),
    ...(parsed.data.heroEnabled !== undefined && {
      heroEnabled: parsed.data.heroEnabled,
    }),
    ...(parsed.data.themeId !== undefined && {
      theme: parsed.data.themeId
        ? { connect: { id: parsed.data.themeId } }
        : { disconnect: true },
    }),
  }

  // Reason: hero relationship is not in the generated PageUpdateInput type until
  // after 'pnpm keystone:dev' runs the add_hero_entity migration.
  await ksCtx.db.Page.updateOne({
    where: { id },
    data: updateData as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  })

  return NextResponse.json({ updated: true })
}

async function deletePageHandler(
  _req: NextRequest,
  ctx?: { params?: Promise<unknown> },
): Promise<NextResponse> {
  const { id } = (await ctx?.params) as { id: string }

  const ksCtx = keystoneContext.sudo()

  const existing = await ksCtx.db.Page.findOne({ where: { id } })
  if (!existing) {
    return NextResponse.json({ message: 'Page not found' }, { status: 404 })
  }

  await ksCtx.db.Page.deleteOne({ where: { id } })

  return new NextResponse(null, { status: 204 })
}

export const GET = apiHandler(getPageHandler)
export const PATCH = apiHandler(updatePageHandler)
export const DELETE = apiHandler(deletePageHandler)
