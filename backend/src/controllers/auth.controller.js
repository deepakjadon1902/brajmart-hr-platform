import { z } from "zod";
import { verifyRefreshToken, issueSession, clearRefreshCookie } from "../services/token.service.js";
import { verifyGoogleCredential } from "../services/google.service.js";
import { User, ROLES } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "../utils/http.js";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(255),
    password: z.string().min(6).max(128),
    role: z.enum(ROLES),
  }),
});

export const googleLoginSchema = z.object({
  body: z.object({
    credential: z.string().min(20),
    role: z.enum(ROLES).optional(),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(255),
    password: z.string().min(8).max(128),
    role: z.enum(ROLES).default("employee"),
    department: z.string().trim().max(100).optional(),
    designation: z.string().trim().max(100).optional(),
    phone: z.string().trim().max(32).optional(),
  }),
});

export const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.validated.body;
  const user = await User.findOne({ email, role }).select("+passwordHash +refreshTokenHash");

  if (!user || !(await user.verifyPassword(password))) {
    throw new AppError("Invalid email, password, or portal role", 401);
  }

  if (user.status === "inactive") throw new AppError("Account is inactive", 403);

  const session = await issueSession(res, user);
  return success(res, session);
});

export const register = asyncHandler(async (req, res) => {
  const existing = await User.exists({ email: req.validated.body.email });
  if (existing) throw new AppError("Email is already registered", 409);

  const user = new User(req.validated.body);
  await user.setPassword(req.validated.body.password);
  await user.save();

  const session = await issueSession(res, user);
  return success(res, session, 201);
});

export const googleLogin = asyncHandler(async (req, res) => {
  const profile = await verifyGoogleCredential(req.validated.body.credential);
  const requestedRole = req.validated.body.role || "employee";

  const user = await User.findOneAndUpdate(
    { email: profile.email },
    {
      $setOnInsert: {
        email: profile.email,
        role: requestedRole,
        companyId: "c1",
        status: "active",
      },
      $set: {
        name: profile.name,
        avatar: profile.avatar,
        googleId: profile.googleId,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  const session = await issueSession(res, user);
  return success(res, session);
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refresh_token;
  if (!refreshToken) throw new AppError("Refresh token missing", 401);

  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.sub).select("+refreshTokenHash");
  if (!user || !(await user.verifyRefreshToken(refreshToken))) {
    throw new AppError("Invalid refresh token", 401);
  }

  const session = await issueSession(res, user);
  return success(res, session);
});

export const me = asyncHandler(async (req, res) => success(res, { user: req.user.toJSON() }));

export const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    req.user.refreshTokenHash = undefined;
    await req.user.save();
  }
  clearRefreshCookie(res);
  return success(res, { loggedOut: true });
});
