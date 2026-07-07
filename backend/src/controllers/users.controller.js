import { z } from "zod";
import { User, ROLES } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { created, success } from "../utils/http.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const listUsersSchema = z.object({
  query: z.object({
    role: z.enum(ROLES).optional(),
    companyId: z.string().trim().max(40).optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
  }),
});

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(255),
    password: z.string().min(8).max(128).optional(),
    role: z.enum(ROLES).default("employee"),
    department: z.string().trim().max(100).optional(),
    designation: z.string().trim().max(100).optional(),
    phone: z.string().trim().max(32).optional(),
    location: z.string().trim().max(120).optional(),
    manager: z.string().trim().max(120).optional(),
    salary: z.number().optional(),
    baseSalary: z.number().optional(),
    monthlyCtc: z.number().optional(),
    annualCtc: z.number().optional(),
    bankAccount: z.string().trim().max(80).optional(),
    companyId: z.string().trim().max(40).optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    name: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().email().max(255).optional(),
    role: z.enum(ROLES).optional(),
    department: z.string().trim().max(100).optional(),
    designation: z.string().trim().max(100).optional(),
    phone: z.string().trim().max(32).optional(),
    location: z.string().trim().max(120).optional(),
    manager: z.string().trim().max(120).optional(),
    salary: z.number().optional(),
    baseSalary: z.number().optional(),
    monthlyCtc: z.number().optional(),
    annualCtc: z.number().optional(),
    bankAccount: z.string().trim().max(80).optional(),
    avatar: z.string().url().optional(),
    status: z.enum(["active", "inactive", "on-leave"]).optional(),
    companyId: z.string().trim().max(40).optional(),
  }),
});

export const idParamSchema = z.object({ params: z.object({ id: objectId }) });

function selectedCompanyId(req) {
  if (req.user.role !== "super-admin") return req.user.companyId;
  const requested = String(req.headers["x-company-id"] || req.validated?.query?.companyId || "").trim();
  return requested || req.user.companyId;
}

export const listUsers = asyncHandler(async (req, res) => {
  const { role, search, page, limit } = req.validated.query;
  const filter = { companyId: selectedCompanyId(req) };
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
      { department: new RegExp(search, "i") },
      { designation: new RegExp(search, "i") },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return success(res, items, 200, { page, limit, total, pages: Math.ceil(total / limit) });
});

export const createUser = asyncHandler(async (req, res) => {
  const existing = await User.exists({ email: req.validated.body.email });
  if (existing) throw new AppError("Email is already registered", 409);

  const user = new User({
    ...req.validated.body,
    companyId:
      req.user.role === "super-admin" && req.validated.body.companyId
        ? req.validated.body.companyId
        : req.user.companyId,
  });

  if (req.validated.body.password) {
    await user.setPassword(req.validated.body.password);
  } else {
    await user.setPassword(`BrajMart@${new Date().getFullYear()}`);
  }

  await user.save();
  return created(res, user);
});

export const getUser = asyncHandler(async (req, res) => {
  const canReadTeam = ["hr", "team-manager", "super-admin"].includes(req.user.role);
  if (req.validated.params.id !== req.user.id && !canReadTeam) {
    throw new AppError("You do not have permission to view this user", 403);
  }

  const filter =
    req.user.role === "super-admin"
      ? { _id: req.validated.params.id }
      : { _id: req.validated.params.id, companyId: req.user.companyId };
  const user = await User.findOne(filter);
  if (!user) throw new AppError("User not found", 404);
  return success(res, user);
});

export const updateUser = asyncHandler(async (req, res) => {
  const isSelf = req.validated.params.id === req.user.id;
  const canManageUsers = ["hr", "super-admin"].includes(req.user.role);

  if (!isSelf && !canManageUsers) {
    throw new AppError("You do not have permission to update this user", 403);
  }

  if (isSelf && !canManageUsers) {
    delete req.validated.body.role;
    delete req.validated.body.status;
    delete req.validated.body.salary;
    delete req.validated.body.baseSalary;
    delete req.validated.body.monthlyCtc;
    delete req.validated.body.annualCtc;
    delete req.validated.body.bankAccount;
    delete req.validated.body.companyId;
  }

  if (req.user.role !== "super-admin") {
    delete req.validated.body.companyId;
  }

  if (req.validated.body.email) {
    const existing = await User.exists({
      email: req.validated.body.email,
      _id: { $ne: req.validated.params.id },
    });
    if (existing) throw new AppError("Email is already registered", 409);
  }

  const filter =
    req.user.role === "super-admin"
      ? { _id: req.validated.params.id }
      : { _id: req.validated.params.id, companyId: req.user.companyId };
  const user = await User.findOneAndUpdate(
    filter,
    { $set: req.validated.body },
    { new: true, runValidators: true },
  );
  if (!user) throw new AppError("User not found", 404);
  return success(res, user);
});

export const removeUser = asyncHandler(async (req, res) => {
  const filter =
    req.user.role === "super-admin"
      ? { _id: req.validated.params.id }
      : { _id: req.validated.params.id, companyId: req.user.companyId };
  const user = await User.findOneAndUpdate(
    filter,
    { $set: { status: "inactive" } },
    { new: true },
  );
  if (!user) throw new AppError("User not found", 404);
  return success(res, user);
});
