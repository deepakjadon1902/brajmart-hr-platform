import { Router } from "express";
import { createMessage, createMessageSchema, listMessages } from "../controllers/messages.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

export const messagesRoutes = Router();

messagesRoutes.use(requireAuth);
messagesRoutes.get("/", listMessages);
messagesRoutes.post("/", validate(createMessageSchema), createMessage);
