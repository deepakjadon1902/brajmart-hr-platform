import { Router } from "express";
import {
  imageKitAuth,
  listDocuments,
  listDocumentsSchema,
  updateDocument,
  updateDocumentSchema,
  uploadDocument,
  uploadMiddleware,
} from "../controllers/documents.controller.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

export const documentsRoutes = Router();

documentsRoutes.use(requireAuth);
documentsRoutes.get("/", validate(listDocumentsSchema), listDocuments);
documentsRoutes.get("/imagekit-auth", allowRoles("employee", "hr", "super-admin"), imageKitAuth);
documentsRoutes.post("/", allowRoles("employee", "hr", "super-admin"), uploadMiddleware, uploadDocument);
documentsRoutes.patch("/:id", allowRoles("hr", "super-admin"), validate(updateDocumentSchema), updateDocument);
