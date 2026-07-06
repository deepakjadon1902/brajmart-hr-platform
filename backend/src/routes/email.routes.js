import { Router } from "express";
import { sendMail, sendEmailSchema } from "../controllers/email.controller.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

export const emailRoutes = Router();

emailRoutes.use(requireAuth, allowRoles("hr", "super-admin", "digital-marketing"));
emailRoutes.post("/send", validate(sendEmailSchema), sendMail);
