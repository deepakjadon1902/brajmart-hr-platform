import { Router } from "express";
import { health } from "../controllers/health.controller.js";
import { authRoutes } from "./auth.routes.js";
import { documentsRoutes } from "./documents.routes.js";
import { emailRoutes } from "./email.routes.js";
import { messagesRoutes } from "./messages.routes.js";
import { usersRoutes } from "./users.routes.js";

export const apiRoutes = Router();

apiRoutes.get("/health", health);
apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/users", usersRoutes);
apiRoutes.use("/documents", documentsRoutes);
apiRoutes.use("/messages", messagesRoutes);
apiRoutes.use("/email", emailRoutes);
