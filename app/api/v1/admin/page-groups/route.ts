import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler } from '@/server/api'
import { keystoneContext } from '@/server/keystone/context'

const CreatePageGroupSchema = z.object({
  pageIndexId: z.string().min(1),
  title: z.string().min(1),
  sortOrder: z.number().int().default(0),
})

async function createPageGroupHandler(
  request: NextRequest,
): Promise<NextResponse> {
  const body = await request.json()
  const parsed = CreatePageGroupSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid input', errors: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const ctx = keystoneContext.sudo()

  const index = await ctx.db.PageIndex.findOne({
    where: { id: parsed.data.pageIndexId },
  })
  if (!index) {
    return NextResponse.json(
      { message: 'Page index not found' },
      { status: 404 },
    )
  }

  const group = await ctx.db.PageGroup.createOne({
    data: {
      title: parsed.data.title,
      sortOrder: parsed.data.sortOrder,
      pageIndex: { connect: { id: parsed.data.pageIndexId } },
    },
  })

  return NextResponse.json(group, { status: 201 })
}

export const POST = apiHandler(createPageGroupHandler)
