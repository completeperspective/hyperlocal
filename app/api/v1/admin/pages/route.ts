import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler } from '@/server/api'
import { keystoneContext } from '@/server/keystone/context'
import type { PageWhereInput } from '.keystone/types'

const CreatePageSchema = z.object({
  title: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must be lowercase letters, numbers, and hyphens only',
    ),
  status: z
    .enum(['draft', 'private', 'membership', 'published'])
    .default('draft'),
})

async function getPagesHandler(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl

  if (searchParams.get('list') === '1') {
    const pages = await keystoneContext.sudo().db.Page.findMany({
      orderBy: [{ title: 'asc' }],
    })
    return NextResponse.json(
      pages.map((p) => ({
        id: p.id,
        title: p.title ?? '',
        slug: p.slug ?? '',
        status: p.status ?? 'draft',
        publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
      })),
    )
  }

  const q = searchParams.get('q') ?? ''
  const excludeIds = (searchParams.get('excludeIds') ?? '')
    .split(',')
    .filter(Boolean)

  const andConditions: PageWhereInput[] = []
  if (q) {
    andConditions.push({
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ],
    })
  }
  if (excludeIds.length > 0) {
    andConditions.push({ id: { notIn: excludeIds } })
  }

  const where: PageWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {}

  const pages = await keystoneContext.sudo().db.Page.findMany({
    where,
    orderBy: [{ title: 'asc' }],
    take: 50,
  })

  return NextResponse.json(
    pages.map((p) => ({
      id: p.id,
      title: p.title ?? '',
      slug: p.slug ?? '',
      status: p.status ?? 'draft',
    })),
  )
}

async function createPageHandler(request: NextRequest): Promise<NextResponse> {
  const body = await request.json()
  const parsed = CreatePageSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid input', errors: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const created = await keystoneContext.sudo().db.Page.createOne({
    data: parsed.data,
  })

  return NextResponse.json(created, { status: 201 })
}

export const GET = apiHandler(getPagesHandler)
export const POST = apiHandler(createPageHandler)
