import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/server/api'
import { keystoneContext } from '@/server/keystone/context'

async function getThemesHandler(): Promise<NextResponse> {
  const themes = await keystoneContext.sudo().db.Theme.findMany({
    orderBy: [{ id: 'asc' }],
  })
  return NextResponse.json(themes)
}

async function createThemeHandler(req: NextRequest): Promise<NextResponse> {
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
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ message: 'name is required' }, { status: 400 })
  }
  const theme = await keystoneContext.sudo().db.Theme.createOne({
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
  return NextResponse.json(theme, { status: 201 })
}

export const GET = apiHandler(getThemesHandler)
export const POST = apiHandler(createThemeHandler)
