import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler } from '@/server/api'
import { keystoneContext } from '@/server/keystone/context'
import type { PageGroupUpdateInput } from '.keystone/types'

const PatchPageGroupSchema = z.object({
  title: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
  pageIds: z.array(z.string()).optional(),
})

async function updatePageGroupHandler(
  req: NextRequest,
  ctx?: { params?: Promise<unknown> },
): Promise<NextResponse> {
  const { id } = (await ctx?.params) as { id: string }
  const body = await req.json()
  const parsed = PatchPageGroupSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid input', errors: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const ksCtx = keystoneContext.sudo()
  const existing = await ksCtx.db.PageGroup.findOne({ where: { id } })
  if (!existing) {
    return NextResponse.json(
      { message: 'Page group not found' },
      { status: 404 },
    )
  }

  const updateData: PageGroupUpdateInput = {
    ...(parsed.data.title !== undefined && { title: parsed.data.title }),
    ...(parsed.data.sortOrder !== undefined && {
      sortOrder: parsed.data.sortOrder,
    }),
    ...(parsed.data.pageIds !== undefined && {
      pages: { set: parsed.data.pageIds.map((pid) => ({ id: pid })) },
    }),
  }

  await ksCtx.db.PageGroup.updateOne({ where: { id }, data: updateData })

  return NextResponse.json({ updated: true })
}

async function deletePageGroupHandler(
  _req: NextRequest,
  ctx?: { params?: Promise<unknown> },
): Promise<NextResponse> {
  const { id } = (await ctx?.params) as { id: string }

  const ksCtx = keystoneContext.sudo()
  const existing = await ksCtx.db.PageGroup.findOne({ where: { id } })
  if (!existing) {
    return NextResponse.json(
      { message: 'Page group not found' },
      { status: 404 },
    )
  }

  await ksCtx.db.PageGroup.deleteOne({ where: { id } })

  return new NextResponse(null, { status: 204 })
}

export const PATCH = apiHandler(updatePageGroupHandler)
export const DELETE = apiHandler(deletePageGroupHandler)
