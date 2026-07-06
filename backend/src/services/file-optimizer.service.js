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

function startsWith(buffer, signature) {
  return signature.every((byte, index) => buffer[index] === byte);
}

function containsAscii(buffer, value, offset = 0) {
  return buffer.subarray(offset, offset + value.length).toString("ascii") === value;
}

export function detectUploadType(buffer) {
  if (!buffer || buffer.length < 4) return null;
  if (startsWith(buffer, [0x25, 0x50, 0x44, 0x46])) return "application/pdf";
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (containsAscii(buffer, "RIFF") && containsAscii(buffer, "WEBP", 8)) return "image/webp";
  if (startsWith(buffer, [0xd0, 0xcf, 0x11, 0xe0])) return "application/msword";
  if (startsWith(buffer, [0x50, 0x4b, 0x03, 0x04]) || startsWith(buffer, [0x50, 0x4b, 0x05, 0x06])) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return null;
}

export async function optimizeUpload(file) {
  const detectedMimeType = detectUploadType(file.buffer);
  if (!detectedMimeType || !ALLOWED_UPLOAD_TYPES.has(detectedMimeType)) {
    throw new AppError("Unsupported or invalid file content. Upload a real PDF, DOC, DOCX, JPG, PNG, or WEBP file.", 400);
  }

  const originalBytes = file.size;
  const baseName = sanitizeFileName(file.originalname);

  if (!isImageUpload(detectedMimeType)) {
    const extension = ALLOWED_UPLOAD_TYPES.get(detectedMimeType);
    return {
      buffer: file.buffer,
      fileName: `${baseName}.${extension}`,
      mimeType: detectedMimeType,
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
  const finalMimeType = useOptimized ? "image/webp" : detectedMimeType;
  const finalExtension = useOptimized ? "webp" : ALLOWED_UPLOAD_TYPES.get(detectedMimeType);
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
