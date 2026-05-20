import { ApiError } from 'next/dist/server/api-utils'
import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/server/api'
import { getSession } from '@/server/auth'
import { keystoneContext } from '@/server/keystone/context'

async function updateProfile(req: NextRequest) {
  const { data: sessionData } = await getSession()
  if (!sessionData?.id) throw new ApiError(401, 'Unauthorized')

  const body = await req.json()

  // Build update from only the fields present in the request body
  const updateData: Record<string, unknown> = {}
  if ('nickname' in body) updateData.nickname = body.nickname
  if ('description' in body) updateData.description = body.description
  if ('location' in body) updateData.location = body.location
  if ('isPublic' in body) updateData.isPublic = body.isPublic
  if ('contactPreference' in body)
    updateData.contactPreference = body.contactPreference

  const user = await keystoneContext.sudo().query.User.findOne({
    where: { id: sessionData.id },
    query: 'profile { id }',
  })

  const profileId = user?.profile?.id

  if (profileId) {
    await keystoneContext.sudo().db.Profile.updateOne({
      where: { id: profileId as string },
      data: updateData,
    })
  } else {
    const createData = {
      owner: { connect: { id: sessionData.id } },
      nickname: (body.nickname as string) ?? '',
      description: (body.description as string) ?? '',
      location: (body.location as string) ?? 'Earth',
      isPublic: (body.isPublic as boolean) ?? false,
    }
    await keystoneContext.sudo().db.Profile.createOne({
      data: createData as unknown as Record<string, unknown>,
    })
  }

  return NextResponse.json({ ok: true })
}

export const PATCH = apiHandler(updateProfile)
