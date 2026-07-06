import { Resend } from "resend";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendEmail({ to, subject, html, text }) {
  if (!resend) throw new AppError("Resend is not configured", 503);

  const response = await resend.emails.send({
    from: env.RESEND_FROM,
    to,
    subject,
    html,
    text,
  });

  if (response.error) {
    throw new AppError(response.error.message || "Unable to send email", 502, response.error);
  }

  return response.data;
}
