import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler } from '@/server/api'
import { AppSettings } from '@/server/helpers/AppSettings'
import { keystoneContext } from '@/server/keystone/context'
import type { SettingsUpdateInput } from '.keystone/types'

const SettingsSchema = z.object({
  siteName: z.string().optional(),
  baseUrl: z.string().optional(),
  copyright: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  robots: z
    .enum([
      'index, follow',
      'noindex, follow',
      'noindex, nofollow, noarchive, nosnippet',
    ])
    .optional(),
  isPrivate: z.boolean().optional(),
  allowSignup: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().optional(),
  gaTrackingId: z.string().optional(),
  transparentHeader: z.boolean().optional(),
  allowWeb3Auth: z.boolean().optional(),
  web3SignInMessage: z.string().optional(),
  receiverWalletAddress: z.string().nullable().optional(),
  themeId: z.string().nullable().optional(),
  ogImageId: z.string().nullable().optional(),
  rootPageIndexId: z.string().nullable().optional(),
  rootCourseId: z.string().nullable().optional(),
})

async function getSettingsHandler(): Promise<NextResponse> {
  const settings = await AppSettings.instance.settings()
  return NextResponse.json({
    ...settings,
    lastReloadedAt: AppSettings.instance.lastReloadedAt?.toISOString() ?? null,
  })
}

async function updateSettingsHandler(req: NextRequest): Promise<NextResponse> {
  const body = await req.json()
  const parsed = SettingsSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid input', errors: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { themeId, ogImageId, rootPageIndexId, rootCourseId, ...scalarData } =
    parsed.data

  // Reason: Keystone db layer uses connect/disconnect for relationship fields,
  // not a raw foreign-key assignment.
  const themeRelation =
    themeId !== undefined
      ? { theme: themeId ? { connect: { id: themeId } } : { disconnect: true } }
      : {}

  const ogImageRelation =
    ogImageId !== undefined
      ? {
          ogImage: ogImageId
            ? { connect: { id: ogImageId } }
            : { disconnect: true },
        }
      : {}

  const rootPageIndexRelation =
    rootPageIndexId !== undefined
      ? {
          rootPageIndex: rootPageIndexId
            ? { connect: { id: rootPageIndexId } }
            : { disconnect: true },
        }
      : {}

  const rootCourseRelation =
    rootCourseId !== undefined
      ? {
          rootCourse: rootCourseId
            ? { connect: { id: rootCourseId } }
            : { disconnect: true },
        }
      : {}

  await keystoneContext.sudo().db.Settings.updateOne({
    where: { id: '1' },
    data: {
      ...scalarData,
      ...themeRelation,
      ...ogImageRelation,
      ...rootPageIndexRelation,
      ...rootCourseRelation,
    } as SettingsUpdateInput,
  })

  await AppSettings.instance.reload()

  return NextResponse.json({
    reloadedAt: AppSettings.instance.lastReloadedAt?.toISOString(),
  })
}

export const GET = apiHandler(getSettingsHandler)
export const POST = apiHandler(updateSettingsHandler)
