import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const client = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

export async function verifyGoogleCredential(credential) {
  if (!client) throw new AppError("Google OAuth is not configured", 503);

  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.email || !payload.email_verified) {
    throw new AppError("Google account email is not verified", 401);
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split("@")[0],
    avatar: payload.picture,
  };
}
