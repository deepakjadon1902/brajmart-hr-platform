import { z } from "zod";
import crypto from "node:crypto";
import { verifyRefreshToken, issueSession, clearRefreshCookie } from "../services/token.service.js";
import { verifyGoogleCredential } from "../services/google.service.js";
import { sendEmail } from "../services/email.service.js";
import { env } from "../config/env.js";
import { User, ROLES } from "../models/User.js";
import { PasswordResetOtp } from "../models/PasswordResetOtp.js";
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

export const passwordResetRequestSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(255),
  }),
});

export const passwordResetVerifySchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(255),
    otp: z.string().trim().regex(/^\d{6}$/, "OTP must be 6 digits"),
  }),
});

export const passwordResetCompleteSchema = passwordResetVerifySchema.extend({
  body: passwordResetVerifySchema.shape.body.extend({
    password: z.string().min(8).max(128),
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
  const roleFilter =
    role === "digital-marketing" ? { $in: ["digital-marketing", "super-admin"] } : role;
  const user = await User.findOne({ email, role: roleFilter }).select(
    "+passwordHash +refreshTokenHash",
  );

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
  const existing = await User.findOne({ email: profile.email });

  const allowedRequestedRole =
    existing?.role === "super-admin" && requestedRole === "digital-marketing"
      ? true
      : existing?.role === requestedRole;

  if (existing && req.validated.body.role && !allowedRequestedRole) {
    throw new AppError("Google account is registered for another portal role", 403);
  }

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

export const googleConfig = asyncHandler(async (_req, res) =>
  success(res, { clientId: env.GOOGLE_CLIENT_ID }),
);

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const email = req.validated.body.email.toLowerCase();
  const user = await User.findOne({ email });

  if (user) {
    const otp = crypto.randomInt(100000, 1000000).toString();
    await PasswordResetOtp.deleteMany({ email });
    await PasswordResetOtp.create({
      email,
      otpHash: PasswordResetOtp.hashOtp(otp),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendEmail({
      to: email,
      subject: "Your BrajMart HRMS password reset OTP",
      text: `Your BrajMart HRMS OTP is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your BrajMart HRMS password reset OTP is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
    });
  }

  return success(res, { message: "If the email exists, an OTP has been sent." });
});

export const verifyPasswordResetOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.validated.body;
  const record = await PasswordResetOtp.findOne({ email: email.toLowerCase() }).sort({
    createdAt: -1,
  });

  if (!record || record.expiresAt < new Date()) throw new AppError("Invalid or expired OTP", 400);
  if (record.attempts >= 5) throw new AppError("Too many OTP attempts. Request a new OTP.", 429);

  if (record.otpHash !== PasswordResetOtp.hashOtp(otp)) {
    record.attempts += 1;
    await record.save();
    throw new AppError("Invalid or expired OTP", 400);
  }

  record.verifiedAt = new Date();
  await record.save();
  return success(res, { verified: true });
});

export const completePasswordReset = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.validated.body;
  const record = await PasswordResetOtp.findOne({ email: email.toLowerCase() }).sort({
    createdAt: -1,
  });

  if (
    !record ||
    record.expiresAt < new Date() ||
    !record.verifiedAt ||
    record.otpHash !== PasswordResetOtp.hashOtp(otp)
  ) {
    throw new AppError("OTP verification is required before resetting password", 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user) throw new AppError("Unable to reset password for this email", 404);

  await user.setPassword(password);
  user.refreshTokenHash = undefined;
  await user.save();
  await PasswordResetOtp.deleteMany({ email: email.toLowerCase() });

  return success(res, { reset: true });
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
