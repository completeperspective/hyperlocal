/* eslint-disable @typescript-eslint/ban-ts-comment */
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

export const prepareFile = async (_filePath: string) => {
  const filePath = path.resolve(_filePath)
  console.log(`Preparing file ${filePath} for upload...`)
  if (!fs.existsSync(filePath)) {
    throw new Error(`File ${filePath} does not exist.`)
  }

  try {
    const upload = new Upload()

    // @ts-ignore - type is incorrect
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

export const deleteFile = (publicId: string, options = {}) => {
  const destroyOptions = {
    // Auth
    api_key: cloudinaryConfig.apiKey,
    api_secret: cloudinaryConfig.apiSecret,
    cloud_name: cloudinaryConfig.cloudName,
    folder: cloudinaryConfig.folder,
    ...options,
  }

  return new Promise((resolve, reject) => {
    if (publicId) {
      cloudinary.v2.uploader.destroy(
        // @ts-ignore - type is incorrect
        publicId,
        // @ts-ignore - type is incorrect
        destroyOptions,
        (error, result) => {
          if (error) {
            reject(error)
          } else {
            resolve(result)
          }
        },
      )
    } else {
      reject(new Error("Missing required argument 'file'."))
    }
  })
}
