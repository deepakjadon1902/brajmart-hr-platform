import { z } from "zod";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { created, success } from "../utils/http.js";

export const createMessageSchema = z.object({
  body: z.object({
    toId: z.string().min(1),
    toName: z.string().trim().min(1).max(120).optional(),
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
  const canBroadcast = ["hr", "super-admin"].includes(req.user.role);
  if (req.validated.body.toId === "all-employees") {
    if (!canBroadcast) throw new AppError("You do not have permission to message all employees", 403);
    const filter = { role: "employee", status: { $ne: "inactive" } };
    if (req.user.role !== "super-admin") filter.companyId = req.user.companyId;
    const employees = await User.find(filter).sort({ name: 1 });
    const messages = await Message.insertMany(
      employees.map((employee) => ({
        fromId: req.user.id,
        fromName: req.user.name,
        toId: employee.id,
        toName: employee.name,
        subject: req.validated.body.subject,
        body: req.validated.body.body,
        channel: req.validated.body.channel,
      })),
    );
    return created(res, messages);
  }

  const recipient = await User.findById(req.validated.body.toId);
  if (!recipient) throw new AppError("Recipient not found", 404);
  if (req.user.role !== "super-admin" && recipient.companyId !== req.user.companyId) {
    throw new AppError("You do not have permission to message this employee", 403);
  }

  const message = await Message.create({
    ...req.validated.body,
    toName: req.validated.body.toName || recipient.name,
    fromId: req.user.id,
    fromName: req.user.name,
  });

  return created(res, message);
});
