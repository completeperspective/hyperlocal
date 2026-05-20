import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler } from '@/server/api'
import { keystoneContext } from '@/server/keystone/context'
import type { PageIndexListItem } from '@/types/page-index'
import type { PageIndexWhereInput } from '.keystone/types'

// Reason: reserved platform paths must be blocked before DB write to prevent
// catch-all route shadowing core platform pages.
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

const CreatePageIndexSchema = z.object({
  title: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must be lowercase letters, numbers, and hyphens only',
    ),
  basePath: z.string().default(''),
  status: z
    .enum(['draft', 'private', 'membership', 'published'])
    .default('draft'),
})

async function getPageIndexesHandler(
  request: NextRequest,
): Promise<NextResponse> {
  const { searchParams } = request.nextUrl
  const q = searchParams.get('q') ?? ''
  const status = searchParams.get('status') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  // Reason: cap pageSize at 100 to guard against accidental large fetches
  const clampedPageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('pageSize') ?? '25', 10) || 25),
  )

  const andConditions: PageIndexWhereInput[] = []
  if (q) {
    andConditions.push({ title: { contains: q, mode: 'insensitive' } })
  }
  if (status) {
    andConditions.push({ status: { equals: status } })
  }
  const where: PageIndexWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {}

  const ctx = keystoneContext.sudo()
  const rawItems = await ctx.db.PageIndex.findMany({
    where,
    orderBy: [{ title: 'asc' }],
    take: clampedPageSize,
    skip: (page - 1) * clampedPageSize,
  })
  const totalCount = await ctx.db.PageIndex.count({ where })

  // Reason: pageCount is expensive to compute inline (requires a join across
  // two relations); return 0 here — callers can fetch the detail endpoint
  // for the exact count.
  const items: PageIndexListItem[] = rawItems.map((item) => ({
    id: item.id,
    title: item.title ?? '',
    slug: item.slug ?? '',
    basePath: item.basePath ?? '',
    status: item.status ?? 'draft',
    pageCount: 0,
  }))

  return NextResponse.json({
    items,
    totalCount,
    page,
    pageSize: clampedPageSize,
    totalPages: Math.ceil(totalCount / clampedPageSize),
  })
}

async function createPageIndexHandler(
  request: NextRequest,
): Promise<NextResponse> {
  const body = await request.json()
  const parsed = CreatePageIndexSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid input', errors: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // Reason: validate reserved prefix at the API layer as a secondary guard —
  // the schema hook also blocks this, but returning a clear 422 from the REST
  // layer gives the client UI a clean error message without going to Keystone.
  const firstSegment = (parsed.data.basePath || parsed.data.slug)
    .split('/')[0]
    .toLowerCase()
  if (RESERVED_BASEPATH_PREFIXES.includes(firstSegment)) {
    return NextResponse.json(
      { message: `"${firstSegment}" is a reserved path prefix.` },
      { status: 422 },
    )
  }

  const created = await keystoneContext.sudo().db.PageIndex.createOne({
    data: parsed.data,
  })

  return NextResponse.json(created, { status: 201 })
}

export const GET = apiHandler(getPageIndexesHandler)
export const POST = apiHandler(createPageIndexHandler)
