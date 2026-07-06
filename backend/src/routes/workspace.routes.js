import { Router } from "express";
import {
  createWorkspaceRecord,
  createWorkspaceSchema,
  deleteWorkspaceRecord,
  listWorkspaceRecords,
  updateWorkspaceRecord,
  updateWorkspaceSchema,
  workspaceRecordSchema,
  workspaceResourceSchema,
} from "../controllers/workspace.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

export const workspaceRoutes = Router();

workspaceRoutes.use(requireAuth);
workspaceRoutes.get("/:resource", validate(workspaceResourceSchema), listWorkspaceRecords);
workspaceRoutes.post("/:resource", validate(createWorkspaceSchema), createWorkspaceRecord);
workspaceRoutes.patch("/:resource/:id", validate(updateWorkspaceSchema), updateWorkspaceRecord);
workspaceRoutes.delete("/:resource/:id", validate(workspaceRecordSchema), deleteWorkspaceRecord);
