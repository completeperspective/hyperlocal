import fs from "fs";
import path from "path";
import mime from "mime";
import cloudinary from "cloudinary";
import Upload from "graphql-upload/Upload.js";
import dotenv from "dotenv";
dotenv.config();

export const cloudinaryConfig = {
  cloudName: process.env.CLOUDINARY_CLOUD || "cloud_name",
  apiKey: process.env.CLOUDINARY_APIKEY || "api_key",
  apiSecret: process.env.CLOUDINARY_SECRET || "api_secret",
  folder: process.env.CLOUDINARY_PROJECT || "project_name",
};

export const prepareFile = (_filePath: string) => {
  const filePath = path.resolve(`./seed-data/${_filePath}`);

  const upload = new Upload();

  upload.resolve({
    createReadStream: () => fs.createReadStream(filePath),
    filename: path.basename(filePath),
    // @ts-ignore
    mimetype: mime.getType(filePath),
    encoding: "utf-8",
  });
  return upload; // as Upload & { file: FileUpload };
};

export const deleteFile = (file?: File, options = {}) => {
  const destroyOptions = {
    // Auth
    api_key: cloudinaryConfig.apiKey,
    api_secret: cloudinaryConfig.apiSecret,
    cloud_name: cloudinaryConfig.cloudName,
    folder: cloudinaryConfig.folder,
    ...options,
  };

  return new Promise((resolve, reject) => {
    if (file) {
      // @ts-ignore
      cloudinary.v2.uploader.destroy(
        // @ts-ignore
        file._meta.public_id,
        // @ts-ignore
        destroyOptions,
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    } else {
      reject(new Error("Missing required argument 'file'."));
    }
  });
};
