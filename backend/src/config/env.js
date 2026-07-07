import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  API_VERSION: z.string().default("v1"),
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required")
    .refine((value) => !/[<>]/.test(value), {
      message: "MONGODB_URI still contains placeholder brackets. Replace <user>, <password>, and <cluster> with real Atlas values.",
    }),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 chars"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 chars"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  CLIENT_URL: z
    .string()
    .default("http://localhost:8080")
    .refine(
      (value) =>
        value
          .split(",")
          .map((origin) => origin.trim())
          .filter(Boolean)
          .every((origin) => z.string().url().safeParse(origin).success),
      "CLIENT_URL must be one or more comma-separated URLs",
    ),
  COOKIE_DOMAIN: z.string().optional().default(""),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  GOOGLE_CALLBACK_URLS: z.string().optional().default(""),
  RESEND_API_KEY: z.string().optional().default(""),
  RESEND_FROM: z.string().email().or(z.string().includes("<")).default("BrajMart HR <no-reply@brajmart.com>"),
  IMAGEKIT_PUBLIC_KEY: z.string().optional().default(""),
  IMAGEKIT_PRIVATE_KEY: z.string().optional().default(""),
  IMAGEKIT_URL_ENDPOINT: z.string().optional().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid backend environment variables", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
