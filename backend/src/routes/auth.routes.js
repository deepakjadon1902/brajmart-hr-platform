import { Router } from "express";
import {
  googleLogin,
  googleLoginSchema,
  login,
  loginSchema,
  logout,
  me,
  refresh,
  register,
  registerSchema,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

export const authRoutes = Router();

authRoutes.post("/login", validate(loginSchema), login);
authRoutes.post("/google", validate(googleLoginSchema), googleLogin);
authRoutes.post("/register", validate(registerSchema), register);
authRoutes.post("/refresh", refresh);
authRoutes.get("/me", requireAuth, me);
authRoutes.post("/logout", requireAuth, logout);
