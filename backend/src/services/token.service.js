import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env, isProduction } from "../config/env.js";

export function signAccessToken(user) {
  return jwt.sign(
    { role: user.role, companyId: user.companyId },
    env.JWT_ACCESS_SECRET,
    {
      subject: user.id,
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      issuer: "brajmart-hr-api",
      audience: "brajmart-hr-portal",
    },
  );
}

export function signRefreshToken(user) {
  return jwt.sign({ nonce: crypto.randomUUID() }, env.JWT_REFRESH_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: "brajmart-hr-api",
    audience: "brajmart-hr-portal",
  });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: "brajmart-hr-api",
    audience: "brajmart-hr-portal",
  });
}

export function setRefreshCookie(res, token, { remember = true } = {}) {
  const options = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    domain: env.COOKIE_DOMAIN || undefined,
    path: "/api/v1/auth",
  };
  if (remember) options.maxAge = 7 * 24 * 60 * 60 * 1000;
  res.cookie("refresh_token", token, options);
}

export function clearRefreshCookie(res) {
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    domain: env.COOKIE_DOMAIN || undefined,
    path: "/api/v1/auth",
  });
}

export async function issueSession(res, user, { remember = true } = {}) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  await user.constructor.updateOne(
    { _id: user._id },
    { $set: { refreshTokenHash, lastLoginAt: new Date() } },
  );
  setRefreshCookie(res, refreshToken, { remember });
  return { user: user.toJSON(), token: accessToken };
}
