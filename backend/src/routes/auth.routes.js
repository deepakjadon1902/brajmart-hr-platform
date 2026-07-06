import { Router } from "express";
import {
  googleLogin,
  googleConfig,
  googleLoginSchema,
  login,
  loginSchema,
  logout,
  me,
  completePasswordReset,
  passwordResetCompleteSchema,
  passwordResetRequestSchema,
  passwordResetVerifySchema,
  refresh,
  register,
  registerSchema,
  requestPasswordReset,
  verifyPasswordResetOtp,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

export const authRoutes = Router();

authRoutes.post("/login", validate(loginSchema), login);
authRoutes.get("/google/config", googleConfig);
authRoutes.post("/google", validate(googleLoginSchema), googleLogin);
authRoutes.post("/register", validate(registerSchema), register);
authRoutes.post("/password-reset/request", validate(passwordResetRequestSchema), requestPasswordReset);
authRoutes.post("/password-reset/verify", validate(passwordResetVerifySchema), verifyPasswordResetOtp);
authRoutes.post("/password-reset/complete", validate(passwordResetCompleteSchema), completePasswordReset);
authRoutes.post("/refresh", refresh);
authRoutes.get("/me", requireAuth, me);
authRoutes.post("/logout", requireAuth, logout);
