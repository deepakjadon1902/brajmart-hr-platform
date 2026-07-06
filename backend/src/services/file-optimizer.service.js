import path from "node:path";
import sharp from "sharp";
import { AppError } from "../utils/AppError.js";

const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const ALLOWED_UPLOAD_TYPES = new Map([
  ["application/pdf", "pdf"],
  ["application/msword", "doc"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export function isImageUpload(mimetype) {
  return IMAGE_MIME_TYPES.has(mimetype);
}

export function sanitizeFileName(fileName) {
  const parsed = path.parse(fileName || "upload");
  const safeBase = parsed.name
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return safeBase || "upload";
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "Uploaded";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function optimizeUpload(file) {
  if (!ALLOWED_UPLOAD_TYPES.has(file.mimetype)) {
    throw new AppError("Unsupported file type. Upload PDF, DOC, DOCX, JPG, PNG, or WEBP.", 400);
  }

  const originalBytes = file.size;
  const baseName = sanitizeFileName(file.originalname);

  if (!isImageUpload(file.mimetype)) {
    const extension = ALLOWED_UPLOAD_TYPES.get(file.mimetype);
    return {
      buffer: file.buffer,
      fileName: `${baseName}.${extension}`,
      mimeType: file.mimetype,
      category: "document",
      originalBytes,
      optimizedBytes: file.buffer.length,
      optimized: false,
      optimization: {
        convertedTo: null,
        originalBytes,
        optimizedBytes: file.buffer.length,
        savedBytes: 0,
        savedPercent: 0,
      },
    };
  }

  const image = sharp(file.buffer, { failOn: "warning" }).rotate();
  const metadata = await image.metadata();
  const shouldResize = (metadata.width || 0) > 1800;
  const pipeline = shouldResize
    ? image.resize({ width: 1800, withoutEnlargement: true, fit: "inside" })
    : image;

  const optimizedBuffer = await pipeline
    .webp({
      quality: 78,
      effort: 5,
      smartSubsample: true,
    })
    .toBuffer();

  const useOptimized = optimizedBuffer.length < file.buffer.length;
  const finalBuffer = useOptimized ? optimizedBuffer : file.buffer;
  const finalMimeType = useOptimized ? "image/webp" : file.mimetype;
  const finalExtension = useOptimized ? "webp" : ALLOWED_UPLOAD_TYPES.get(file.mimetype);
  const savedBytes = Math.max(0, originalBytes - finalBuffer.length);

  return {
    buffer: finalBuffer,
    fileName: `${baseName}.${finalExtension}`,
    mimeType: finalMimeType,
    category: "image",
    originalBytes,
    optimizedBytes: finalBuffer.length,
    optimized: useOptimized,
    optimization: {
      convertedTo: useOptimized ? "webp" : null,
      originalBytes,
      optimizedBytes: finalBuffer.length,
      savedBytes,
      savedPercent: originalBytes ? Math.round((savedBytes / originalBytes) * 100) : 0,
      width: metadata.width,
      height: metadata.height,
    },
  };
}
