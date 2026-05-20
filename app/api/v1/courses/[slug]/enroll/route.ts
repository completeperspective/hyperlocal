import { ApiError } from 'next/dist/server/api-utils'
import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/server/api'
import { getSession } from '@/server/auth'
import { upsertCourseEnrollment } from '@/server/helpers/get-course-progress'
import { keystoneContext } from '@/server/keystone/context'

async function enrollHandler(
  _req: NextRequest,
  ctx?: { params?: Promise<unknown> },
) {
  const { data: sessionData } = await getSession()
  if (!sessionData?.id) throw new ApiError(401, 'Unauthorized')

  const { slug } = (await ctx?.params) as { slug: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sudoCtx = keystoneContext.sudo() as any
  const courses = await sudoCtx.query.Course.findMany({
    where: { slug: { equals: slug } },
    query: 'id',
    take: 1,
  })
  if (!courses.length) throw new ApiError(404, 'Course not found')

  const enrollmentId = await upsertCourseEnrollment(
    sessionData.id,
    courses[0].id,
  )
  return NextResponse.json({ enrollmentId })
}

export const POST = apiHandler(enrollHandler)
