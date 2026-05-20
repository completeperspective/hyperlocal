import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/server/api'
import { keystoneContext } from '@/server/keystone/context'

async function getThemeHandler(
  _req: NextRequest,
  ctx?: { params?: Promise<unknown> },
): Promise<NextResponse> {
  const { id } = (await ctx?.params) as { id: string }
  const theme = await keystoneContext.sudo().db.Theme.findOne({ where: { id } })
  if (!theme)
    return NextResponse.json({ message: 'Theme not found' }, { status: 404 })
  return NextResponse.json(theme)
}

async function updateThemeHandler(
  req: NextRequest,
  ctx?: { params?: Promise<unknown> },
): Promise<NextResponse> {
  const { id } = (await ctx?.params) as { id: string }
  const body = await req.json()
  const {
    name,
    lightMode,
    darkMode,
    radius,
    fontHeading,
    fontBody,
    colorScheme,
  } = body
  const theme = await keystoneContext.sudo().db.Theme.updateOne({
    where: { id },
    data: {
      name,
      lightMode,
      darkMode,
      radius,
      fontHeading,
      fontBody,
      colorScheme: colorScheme ?? null,
    },
  })
  return NextResponse.json(theme)
}

async function deleteThemeHandler(
  _req: NextRequest,
  ctx?: { params?: Promise<unknown> },
): Promise<NextResponse> {
  const { id } = (await ctx?.params) as { id: string }
  await keystoneContext.sudo().db.Theme.deleteOne({ where: { id } })
  return NextResponse.json({ success: true })
}

export const GET = apiHandler(getThemeHandler)
export const PUT = apiHandler(updateThemeHandler)
export const DELETE = apiHandler(deleteThemeHandler)
