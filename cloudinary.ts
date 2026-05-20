import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import cloudinary from 'cloudinary'
import Upload from 'graphql-upload/Upload.js'
import mime from 'mime-types'

export const cloudinaryConfig = {
  cloudName: process.env.CLOUDINARY_CLOUD as string,
  apiKey: process.env.CLOUDINARY_APIKEY as string,
  apiSecret: process.env.CLOUDINARY_SECRET as string,
  folder: process.env.CLOUDINARY_PROJECT as string,
}

// Reason: configure the SDK once at module load so utils.api_sign_request and
// cloudinary.v2.url (used for signed URL generation) have credentials available.
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD,
  api_key: process.env.CLOUDINARY_APIKEY,
  api_secret: process.env.CLOUDINARY_SECRET,
})

export const prepareFile = async (_filePath: string) => {
  const filePath = path.resolve(_filePath)
  console.log(`Preparing file ${filePath} for upload...`)
  if (!fs.existsSync(filePath)) {
    throw new Error(`File ${filePath} does not exist.`)
  }

  try {
    const upload = new Upload()

    // @ts-expect-error - workaround for seeding uploads
    upload.resolve({
      createReadStream: () => fs.createReadStream(filePath),
      file: path.basename(filePath),
      mimetype: mime.lookup(filePath),
      encoding: 'utf-8',
    })

    console.log(`Upload ${upload} prepared for upload.`)
    return upload
  } catch (error) {
    console.error(`Error preparing file ${filePath} for upload:`, error)
    throw error
  }
}

export function getPublicId(publicUrl: string): string {
  // e.g. https://res.cloudinary.com/demo/image/upload/v1234567890/folder/image.jpg
  // → folder/image.jpg
  const match = publicUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i)
  return match ? match[1] : ''
}

export const deleteFileByPublicId = (publicId: string, options = {}) => {
  const destroyOptions = {
    api_key: cloudinaryConfig.apiKey,
    api_secret: cloudinaryConfig.apiSecret,
    cloud_name: cloudinaryConfig.cloudName,
    folder: cloudinaryConfig.folder,
    ...options,
  }

  return new Promise((resolve, reject) => {
    if (!publicId) {
      reject(new Error("Missing required argument 'publicId'."))
      return
    }
    cloudinary.v2.uploader.destroy(
      publicId,
      // @ts-expect-error - cloudinary types don't accept auth params in destroy options
      destroyOptions,
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      },
    )
  })
}

export interface CloudinaryImageUploadResult {
  publicId: string
  secureUrl: string
  width: number
  height: number
  format: string
  bytes: number
}

export async function uploadImage(
  buffer: Buffer,
  options: { folder?: string } = {},
): Promise<CloudinaryImageUploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        resource_type: 'image',
        type: 'upload',
        // Reason: pass credentials explicitly so the upload works even if the
        // global cloudinary.v2.config() hasn't propagated to this module instance
        // (can happen in Next.js module bundling).
        cloud_name: cloudinaryConfig.cloudName,
        api_key: cloudinaryConfig.apiKey,
        api_secret: cloudinaryConfig.apiSecret,
        folder: options.folder ?? cloudinaryConfig.folder,
        use_filename: false,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload failed'))
        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        })
      },
    )
    stream.end(buffer)
  })
}

export async function uploadProfileImage(
  buffer: Buffer,
  fileInfo?: { filename?: string; mimetype?: string },
): Promise<{
  publicId: string
  secureUrl: string
  sourceData: Record<string, unknown>
}> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        resource_type: 'image',
        type: 'upload',
        cloud_name: cloudinaryConfig.cloudName,
        api_key: cloudinaryConfig.apiKey,
        api_secret: cloudinaryConfig.apiSecret,
        folder: `${cloudinaryConfig.folder}/avatars`,
        use_filename: false,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload failed'))
        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          // Reason: Keystone's cloudinaryImage resolves publicUrl from _meta.secure_url.
          // The outer fields (filename, mimetype, encoding) mirror what Keystone stores
          // when it handles the upload itself — without them publicUrl returns null.
          sourceData: {
            id: result.public_id,
            filename: fileInfo?.filename ?? result.public_id,
            originalFilename: fileInfo?.filename ?? result.public_id,
            mimetype: fileInfo?.mimetype ?? `image/${result.format}`,
            encoding: '7bit',
            _meta: result,
          },
        })
      },
    )
    stream.end(buffer)
  })
}

/**
 * Upload a raw (non-image) file to Cloudinary as a private asset.
 * Private assets are inaccessible via direct URL — downloads must go through
 * a signed URL generated by generateSignedUrl().
 * Returns publicId, bytes, and format from the Cloudinary response.
 */
export async function uploadRawFile(
  buffer: Buffer,
  options: { filename: string; folder?: string },
): Promise<{
  publicId: string
  bytes: number
  format: string
}> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        resource_type: 'raw',
        type: 'private',
        folder: options.folder ?? cloudinaryConfig.folder,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload failed'))
        resolve({
          publicId: result.public_id,
          bytes: result.bytes,
          format: result.format,
        })
      },
    )
    stream.end(buffer)
  })
}

/**
 * Generate an authenticated download URL for a private Cloudinary raw asset.
 * Uses the admin-API private_download_url which signs with a fresh HMAC
 * timestamp — more reliable than delivery-URL signing for type:'private' assets.
 * The URL is fetched server-side only and never sent to the browser.
 */
export function generateSignedUrl(publicId: string): string {
  // Reason: raw asset public_ids include the file extension (e.g. folder/file.pdf).
  // private_download_url requires the format as a separate param.
  const format = publicId.split('.').pop() ?? ''
  return cloudinary.v2.utils.private_download_url(publicId, format, {
    resource_type: 'raw',
  })
}
