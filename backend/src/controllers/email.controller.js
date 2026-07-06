import { z } from "zod";
import { sendEmail } from "../services/email.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "../utils/http.js";

export const sendEmailSchema = z.object({
  body: z.object({
    to: z.union([z.string().email(), z.array(z.string().email()).min(1).max(100)]),
    subject: z.string().trim().min(1).max(180),
    html: z.string().min(1).max(100000),
    text: z.string().max(10000).optional(),
  }),
});

export const sendMail = asyncHandler(async (req, res) => {
  const data = await sendEmail(req.validated.body);
  return success(res, data);
});
