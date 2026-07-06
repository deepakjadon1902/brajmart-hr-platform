import { z } from "zod";
import { Message } from "../models/Message.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { created, success } from "../utils/http.js";

export const createMessageSchema = z.object({
  body: z.object({
    toId: z.string().min(1),
    toName: z.string().trim().min(1).max(120),
    subject: z.string().trim().min(1).max(160),
    body: z.string().trim().min(1).max(5000),
    channel: z.enum(["hr", "manager", "team", "employee"]).default("employee"),
  }),
});

export const listMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({
    $or: [{ toId: req.user.id }, { fromId: req.user.id }, { toId: req.user.role }],
  }).sort({ createdAt: -1 });

  return success(res, messages);
});

export const createMessage = asyncHandler(async (req, res) => {
  const message = await Message.create({
    ...req.validated.body,
    fromId: req.user.id,
    fromName: req.user.name,
  });

  return created(res, message);
});
