import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler } from '@/server/api'
import { keystoneContext } from '@/server/keystone/context'

// Reason: reserved platform paths must be blocked at the PATCH layer too —
// an edit could change basePath/slug to a reserved value.
const RESERVED_BASEPATH_PREFIXES = [
  'api',
  'courses',
  'admin',
  'dashboard',
  'profile',
  'settings',
  'onboarding',
  'login',
  'logout',
  'signup',
  'get-access',
  '_next',
  'static',
]

const PatchPageIndexSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  basePath: z.string().optional(),
  status: z.enum(['draft', 'private', 'membership', 'published']).optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  groupsLabel: z.string().optional(),
  trustedHtml: z.string().optional(),
  customCss: z.string().optional(),
  ogImageId: z.string().nullable().optional(),
  pageIds: z.array(z.string()).optional(),
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

async function getPageIndexHandler(
  _req: NextRequest,
  ctx?: { params?: Promise<unknown> },
): Promise<NextResponse> {
  const { id } = (await ctx?.params) as { id: string }

  const ksCtx = keystoneContext.sudo()
  const raw = await ksCtx.query.PageIndex.findOne({
    where: { id },
    query: `
      id title slug basePath status publishedAt
      metaTitle metaDescription groupsLabel trustedHtml customCss
      ogImage { id title source { publicUrl } }
      ${HERO_QUERY}
      theme { id name }
      pages(orderBy: { slug: asc }) { id title slug status }
      groups(orderBy: { sortOrder: asc }) {
        id title sortOrder
        pages(orderBy: { slug: asc }) { id title slug status }
      }
    `,
  })

  if (!raw) {
    return NextResponse.json(
      { message: 'Page index not found' },
      { status: 404 },
    )
  }

  // Reason: Keystone returns a Proxy object; JSON round-trip strips the proxy
  // so plain objects are returned to the client.
  return NextResponse.json(JSON.parse(JSON.stringify(raw)))
}

async function updatePageIndexHandler(
  req: NextRequest,
  ctx?: { params?: Promise<unknown> },
): Promise<NextResponse> {
  const { id } = (await ctx?.params) as { id: string }
  const body = await req.json()
  const parsed = PatchPageIndexSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid input', errors: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const ksCtx = keystoneContext.sudo()

  const existing = await ksCtx.db.PageIndex.findOne({ where: { id } })
  if (!existing) {
    return NextResponse.json(
      { message: 'Page index not found' },
      { status: 404 },
    )
  }

  // Reason: check reserved prefix only when basePath or slug is being changed —
  // an update touching neither field cannot introduce a reserved path violation.
  if (parsed.data.basePath !== undefined || parsed.data.slug !== undefined) {
    const effectiveBasePath =
      parsed.data.basePath !== undefined
        ? parsed.data.basePath
        : (existing.basePath ?? '')
    const effectiveSlug =
      parsed.data.slug !== undefined ? parsed.data.slug : (existing.slug ?? '')

    const firstSegment = (effectiveBasePath || effectiveSlug)
      .split('/')[0]
      .toLowerCase()
    if (RESERVED_BASEPATH_PREFIXES.includes(firstSegment)) {
      return NextResponse.json(
        { message: `"${firstSegment}" is a reserved path prefix.` },
        { status: 422 },
      )
    }
  }

  // Build update payload — only include fields that were provided in the request.
  // Reason: cast needed because groupsLabel + hero relationship are added by a pending
  // migration and won't exist in the generated PageIndexUpdateInput until after `pnpm keystone:dev`.
  const updateData = {
    ...(parsed.data.title !== undefined && { title: parsed.data.title }),
    ...(parsed.data.slug !== undefined && { slug: parsed.data.slug }),
    ...(parsed.data.basePath !== undefined && {
      basePath: parsed.data.basePath,
    }),
    ...(parsed.data.status !== undefined && { status: parsed.data.status }),
    ...(parsed.data.metaTitle !== undefined && {
      metaTitle: parsed.data.metaTitle ?? '',
    }),
    ...(parsed.data.metaDescription !== undefined && {
      metaDescription: parsed.data.metaDescription ?? '',
    }),
    ...(parsed.data.groupsLabel !== undefined && {
      groupsLabel: parsed.data.groupsLabel,
    }),
    ...(parsed.data.trustedHtml !== undefined && {
      trustedHtml: parsed.data.trustedHtml,
    }),
    ...(parsed.data.customCss !== undefined && {
      customCss: parsed.data.customCss,
    }),
    ...(parsed.data.ogImageId !== undefined && {
      ogImage: parsed.data.ogImageId
        ? { connect: { id: parsed.data.ogImageId } }
        : { disconnect: true },
    }),
    ...(parsed.data.pageIds !== undefined && {
      pages: { set: parsed.data.pageIds.map((pid) => ({ id: pid })) },
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

  await ksCtx.db.PageIndex.updateOne({
    where: { id },
    data: updateData as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  })

  return NextResponse.json({ updated: true })
}

async function deletePageIndexHandler(
  _req: NextRequest,
  ctx?: { params?: Promise<unknown> },
): Promise<NextResponse> {
  const { id } = (await ctx?.params) as { id: string }

  const ksCtx = keystoneContext.sudo()

  const existing = await ksCtx.db.PageIndex.findOne({ where: { id } })
  if (!existing) {
    return NextResponse.json(
      { message: 'Page index not found' },
      { status: 404 },
    )
  }

  await ksCtx.db.PageIndex.deleteOne({ where: { id } })

  return new NextResponse(null, { status: 204 })
}

export const GET = apiHandler(getPageIndexHandler)
export const PATCH = apiHandler(updatePageIndexHandler)
export const DELETE = apiHandler(deletePageIndexHandler)
