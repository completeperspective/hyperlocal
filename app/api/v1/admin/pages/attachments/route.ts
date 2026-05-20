import { ApiError } from 'next/dist/server/api-utils'
import { NextRequest, NextResponse } from 'next/server'
import mime from 'mime-types'
import { apiHandler } from '@/server/api'
import { deleteFileByPublicId, uploadRawFile } from '@/server/helpers'
import { keystoneContext } from '@/server/keystone/context'

async function uploadAttachmentHandler(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const pageId = formData.get('pageId') as string | null
  const title = (formData.get('title') as string | null) ?? ''

  if (!file || !pageId) {
    throw new ApiError(400, 'Missing required fields: file, pageId')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = file.name
  const mimeType =
    file.type || (mime.lookup(filename) as string) || 'application/octet-stream'

  const uploaded = await uploadRawFile(buffer, { filename })

  const { query } = keystoneContext.sudo()

  const attachment = await query.PageAttachment.createOne({
    data: {
      page: { connect: { id: pageId } },
      title,
      filename,
      publicId: uploaded.publicId,
      mimeType,
      format: uploaded.format,
      bytes: uploaded.bytes,
    },
    query: 'id title filename bytes format mimeType',
  })

  return NextResponse.json({ data: attachment }, { status: 201 })
}

async function deleteAttachmentHandler(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const attachmentId = searchParams.get('id')

  if (!attachmentId) {
    throw new ApiError(400, 'Missing required query param: id')
  }

  const { query } = keystoneContext.sudo()

  const attachment = await query.PageAttachment.findOne({
    where: { id: attachmentId },
    query: 'id publicId',
  })

  if (!attachment) {
    throw new ApiError(404, 'Attachment not found')
  }

  await deleteFileByPublicId(attachment.publicId, { resource_type: 'raw' })

  await query.PageAttachment.deleteOne({
    where: { id: attachmentId },
  })

  return NextResponse.json({ ok: true })
}

export const POST = apiHandler(uploadAttachmentHandler)
export const DELETE = apiHandler(deleteAttachmentHandler)
