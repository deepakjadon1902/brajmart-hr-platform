import multer from "multer";
import { z } from "zod";
import { EmployeeDocument } from "../models/EmployeeDocument.js";
import { User } from "../models/User.js";
import { ALLOWED_UPLOAD_TYPES, formatBytes, optimizeUpload } from "../services/file-optimizer.service.js";
import { getImageKitAuth, uploadBuffer } from "../services/imagekit.service.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { created, success } from "../utils/http.js";

const storage = multer.memoryStorage();
export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 12 * 1024 * 1024,
    files: 1,
    fields: 8,
    fieldNameSize: 80,
    fieldSize: 10 * 1024,
  },
  fileFilter(_req, file, cb) {
    cb(
      ALLOWED_UPLOAD_TYPES.has(file.mimetype)
        ? null
        : new AppError("Unsupported file type. Upload PDF, DOC, DOCX, JPG, PNG, or WEBP.", 400),
    );
  },
}).single("file");

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const listDocumentsSchema = z.object({
  query: z.object({
    employeeId: z.string().optional(),
    status: z.enum(["submitted", "verified", "needs-update"]).optional(),
  }),
});

export const updateDocumentSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ status: z.enum(["submitted", "verified", "needs-update"]) }),
});

export const imageKitAuth = asyncHandler(async (_req, res) => success(res, getImageKitAuth()));

export const listDocuments = asyncHandler(async (req, res) => {
  const canReviewDocuments = ["hr", "super-admin"].includes(req.user.role);
  const filter = {};

  if (canReviewDocuments) {
    const employees = await User.find({ companyId: req.user.companyId }).select("_id");
    filter.employeeId = { $in: employees.map((employee) => employee._id) };
    if (req.validated.query.employeeId) filter.employeeId = req.validated.query.employeeId;
  } else {
    filter.employeeId = req.user.id;
  }

  if (req.validated.query.status) filter.status = req.validated.query.status;
  const documents = await EmployeeDocument.find(filter).sort({ createdAt: -1 });
  return success(res, documents);
});

export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError("File is required", 400);

  const employeeId = req.body.employeeId || req.user.id;
  const canUploadForOthers = ["hr", "super-admin"].includes(req.user.role);
  if (employeeId !== req.user.id && !canUploadForOthers) {
    throw new AppError("You do not have permission to upload for this employee", 403);
  }

  const employee = await User.findById(employeeId);
  if (!employee || employee.companyId !== req.user.companyId) {
    throw new AppError("Employee not found", 404);
  }

  const optimizedFile = await optimizeUpload(req.file);
  const folderType = optimizedFile.category === "image" ? "images" : "documents";
  const result = await uploadBuffer({
    buffer: optimizedFile.buffer,
    fileName: optimizedFile.fileName,
    folder: `/brajmart/hr/${employee.companyId}/${folderType}`,
    tags: ["hr", folderType, employee.role, optimizedFile.mimeType],
  });

  const document = await EmployeeDocument.create({
    employeeId: employee.id,
    employeeName: employee.name,
    name: req.body.name || req.file.originalname,
    type: req.body.type || optimizedFile.mimeType,
    mimeType: optimizedFile.mimeType,
    category: optimizedFile.category,
    size: formatBytes(optimizedFile.optimizedBytes),
    originalSize: formatBytes(optimizedFile.originalBytes),
    originalBytes: optimizedFile.originalBytes,
    optimizedBytes: optimizedFile.optimizedBytes,
    optimized: optimizedFile.optimized,
    optimization: optimizedFile.optimization,
    fileUrl: result.url,
    imagekitFileId: result.fileId,
  });

  return created(res, document);
});

export const updateDocument = asyncHandler(async (req, res) => {
  const document = await EmployeeDocument.findById(req.validated.params.id);
  if (!document) throw new AppError("Document not found", 404);

  const employee = await User.findById(document.employeeId).select("companyId");
  if (!employee || employee.companyId !== req.user.companyId) {
    throw new AppError("Document not found", 404);
  }

  document.status = req.validated.body.status;
  await document.save();

  return success(res, document);
});
