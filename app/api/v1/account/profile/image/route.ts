import { ApiError } from 'next/dist/server/api-utils'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { deleteFileByPublicId, uploadProfileImage } from '~/cloudinary'
import { apiHandler } from '@/server/api'
import { getSession, refreshUserSession } from '@/server/auth'
import { keystoneContext } from '@/server/keystone/context'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

async function handleUpload(req: NextRequest) {
  const { data: sessionData } = await getSession()
  if (!sessionData?.id) throw new ApiError(401, 'Unauthorized')

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) throw new ApiError(400, 'No file provided')
  if (!ALLOWED_TYPES.has(file.type))
    throw new ApiError(400, 'Invalid file type. Allowed: JPEG, PNG, WebP')
  if (file.size > MAX_FILE_SIZE)
    throw new ApiError(400, 'File too large. Maximum size is 5 MB')

  const user = (await keystoneContext.sudo().query.User.findOne({
    where: { id: sessionData.id },
    query: 'profile { id image { id } }',
  })) as unknown as { profile?: { id?: string; image?: { id?: string } } }

  const profileId = user?.profile?.id as string | undefined
  const existingImageId = user?.profile?.image?.id as string | undefined

  // Delete old Cloudinary asset + DB record before uploading to avoid orphaned files
  if (existingImageId) {
    const existing = await keystoneContext
      .sudo()
      .prisma.profileImage.findUnique({ where: { id: existingImageId } })
    const publicId = (
      (existing?.source as Record<string, unknown> | null)?._meta as
        | Record<string, unknown>
        | undefined
    )?.public_id as string | undefined
    if (publicId) {
      await deleteFileByPublicId(publicId).catch(() => {
        // Non-fatal: a Cloudinary delete failure should not block the new upload
      })
    }
    await keystoneContext
      .sudo()
      .prisma.profileImage.delete({ where: { id: existingImageId } })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const { secureUrl, sourceData } = await uploadProfileImage(buffer, {
    filename: file.name,
    mimetype: file.type,
  })

  // Reason: use Prisma directly to bypass Keystone's GraphQL cloudinaryImage Upload scalar
  // validation — we already have the Cloudinary metadata and just need to persist the JSON.
  const newImage = await keystoneContext.sudo().prisma.profileImage.create({
    data: {
      source: sourceData as Prisma.InputJsonValue,
      altText: sessionData.name ?? '',
    },
  })

  if (profileId) {
    await keystoneContext.sudo().db.Profile.updateOne({
      where: { id: profileId },
      data: { image: { connect: { id: newImage.id } } },
    })
  } else {
    await keystoneContext.sudo().db.Profile.createOne({
      data: {
        owner: { connect: { id: sessionData.id } },
        image: { connect: { id: newImage.id } },
      },
    })
  }

  // Refresh session so the header avatar reflects the new image immediately
  await refreshUserSession(sessionData.id)

  return NextResponse.json({ ok: true, url: secureUrl })
}

export const POST = apiHandler(handleUpload)
