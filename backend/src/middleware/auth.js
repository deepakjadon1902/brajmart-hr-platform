import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { canAccessAnyPortal } from "../utils/portalAccess.js";

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) throw new AppError("Authentication required", 401);

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || user.status === "inactive") throw new AppError("Invalid session", 401);
    req.user = user;
    return next();
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }
});

export const allowRoles = (...roles) => (req, _res, next) => {
  if (!req.user || !canAccessAnyPortal(req.user, roles)) {
    return next(new AppError("You do not have permission to perform this action", 403));
  }
  return next();
};
