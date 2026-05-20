import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/server/api'
import { uploadImage } from '@/server/helpers'
import { keystoneContext } from '@/server/keystone/context'

const ACCEPTED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
])
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

async function uploadOgImageHandler(req: NextRequest): Promise<NextResponse> {
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json(
      { message: 'Missing required field: file' },
      { status: 400 },
    )
  }
  if (!ACCEPTED_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        message: `Unsupported file type: ${file.type}. Accepted: jpeg, png, gif, webp`,
      },
      { status: 400 },
    )
  }
  const buffer = Buffer.from(await file.arrayBuffer())

  // Reason: check buffer.byteLength (not file.size) so the guard works correctly
  // in both production and test environments where file.size may not be preserved
  // through the multipart FormData roundtrip.
  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json(
      { message: 'File too large. Max size: 5 MB' },
      { status: 400 },
    )
  }
  const uploaded = await uploadImage(buffer)

  // Reason: Keystone's cloudinaryImage output resolver reads _meta.secure_url to
  // produce the publicUrl GraphQL field. Writing this shape directly to the Json
  // column keeps it compatible with Keystone's reader without going through the
  // GraphQL Upload flow that the Keystone admin UI uses.
  const sourceJson = {
    _meta: {
      public_id: uploaded.publicId,
      secure_url: uploaded.secureUrl,
      width: uploaded.width,
      height: uploaded.height,
      format: uploaded.format,
      bytes: uploaded.bytes,
      resource_type: 'image',
      type: 'upload',
    },
  }

  const record = await keystoneContext.sudo().prisma.oGImage.create({
    data: {
      title: file.name,
      source: sourceJson,
      altText: '',
    },
    select: { id: true },
  })

  return NextResponse.json(
    { id: record.id, url: uploaded.secureUrl },
    { status: 201 },
  )
}

export const POST = apiHandler(uploadOgImageHandler)
