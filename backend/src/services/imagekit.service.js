import ImageKit from "imagekit";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const imagekit =
  env.IMAGEKIT_PUBLIC_KEY && env.IMAGEKIT_PRIVATE_KEY && env.IMAGEKIT_URL_ENDPOINT
    ? new ImageKit({
        publicKey: env.IMAGEKIT_PUBLIC_KEY,
        privateKey: env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
      })
    : null;

export function getImageKitAuth() {
  if (!imagekit) throw new AppError("ImageKit is not configured", 503);
  return imagekit.getAuthenticationParameters();
}

export async function uploadBuffer({ buffer, fileName, folder, tags }) {
  if (!imagekit) throw new AppError("ImageKit is not configured", 503);

  return imagekit.upload({
    file: buffer,
    fileName,
    folder,
    tags,
    useUniqueFileName: true,
  });
}
