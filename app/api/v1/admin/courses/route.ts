import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler } from '@/server/api'
import { keystoneContext } from '@/server/keystone/context'

const CreateCourseSchema = z.object({
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

async function getCoursesHandler(): Promise<NextResponse> {
  const courses = await keystoneContext.sudo().query.Course.findMany({
    query: 'id title slug status heroEnabled chapters { id }',
    orderBy: [{ title: 'asc' }],
  })

  return NextResponse.json(
    (
      courses as Array<{
        id: string
        title: string
        slug: string
        status: string | null
        heroEnabled: boolean | null
        chapters: unknown[]
      }>
    ).map((c) => ({
      id: c.id,
      title: c.title ?? '',
      slug: c.slug ?? '',
      status: c.status ?? 'draft',
      heroEnabled: c.heroEnabled ?? false,
      chapterCount: Array.isArray(c.chapters) ? c.chapters.length : 0,
    })),
  )
}

async function createCourseHandler(
  request: NextRequest,
): Promise<NextResponse> {
  const body = await request.json()
  const parsed = CreateCourseSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid input', errors: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const created = await keystoneContext.sudo().db.Course.createOne({
    data: parsed.data,
  })

  return NextResponse.json(created, { status: 201 })
}

export const GET = apiHandler(getCoursesHandler)
export const POST = apiHandler(createCourseHandler)
