import { z } from "zod";
import {
  Asset,
  AttendanceRecord,
  Client,
  Holiday,
  Invoice,
  LeaveRequest,
  Notification,
  Payslip,
  PermissionGrant,
  RoleAssignment,
  Shift,
} from "../models/PortalData.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { created, success } from "../utils/http.js";

const today = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);
const nowStamp = () => {
  const d = new Date();
  return `${d.toISOString().slice(0, 10)} ${d.toTimeString().slice(0, 5)}`;
};

const resourceMap = {
  attendance: { model: AttendanceRecord, employeeScoped: true },
  leaves: { model: LeaveRequest, employeeScoped: true },
  holidays: { model: Holiday },
  shifts: { model: Shift },
  payslips: { model: Payslip, employeeScoped: true },
  assets: { model: Asset, employeeScoped: true },
  notifications: { model: Notification, employeeScoped: true },
  clients: { model: Client, roles: ["hr", "super-admin", "digital-marketing"] },
  invoices: { model: Invoice, roles: ["hr", "super-admin", "digital-marketing"] },
  roleAssignments: { model: RoleAssignment, roles: ["super-admin"] },
  permissionGrants: { model: PermissionGrant, roles: ["super-admin"] },
};

export const workspaceResourceSchema = z.object({
  params: z.object({ resource: z.enum(Object.keys(resourceMap)) }),
});

export const workspaceRecordSchema = workspaceResourceSchema.extend({
  params: workspaceResourceSchema.shape.params.extend({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid id"),
  }),
});

export const createWorkspaceSchema = workspaceResourceSchema.extend({
  body: z.record(z.unknown()),
});

export const updateWorkspaceSchema = workspaceRecordSchema.extend({
  body: z.record(z.unknown()),
});

function getConfig(resource) {
  return resourceMap[resource];
}

function assertCanUseResource(req, resource, config, write = false) {
  if (config.roles && !config.roles.includes(req.user.role)) {
    throw new AppError("You do not have permission to access this portal data", 403);
  }
  const employeeWritable = ["attendance", "leaves"].includes(resource) && req.user.role === "employee";
  if (write && !employeeWritable && !["hr", "super-admin", "digital-marketing"].includes(req.user.role)) {
    throw new AppError("You do not have permission to manage this portal data", 403);
  }
}

function scopeForUser(req, config) {
  const filter = { companyId: req.user.companyId };
  if (config.employeeScoped && !["hr", "team-manager", "super-admin"].includes(req.user.role)) {
    filter.employeeId = req.user.id;
  }
  return filter;
}

function clean(body) {
  const copy = { ...body };
  delete copy.id;
  delete copy._id;
  delete copy.companyId;
  delete copy.createdAt;
  delete copy.updatedAt;
  return copy;
}

async function enrichCreate(req, resource, body) {
  const record = clean(body);
  record.companyId = req.user.companyId;

  if (["attendance", "leaves", "payslips", "assets", "notifications", "roleAssignments", "permissionGrants"].includes(resource)) {
    record.employeeId = record.employeeId || req.user.id;
    if (req.user.role === "employee") record.employeeId = req.user.id;
    const employee = await User.findOne({ _id: record.employeeId, companyId: req.user.companyId });
    if (!employee) throw new AppError("Employee not found", 404);
    record.employeeName = record.employeeName || employee.name;
  }

  if (resource === "attendance") {
    record.date = record.date || today();
    record.checkIn = record.checkIn || nowTime();
    record.status = record.status || "present";
  }
  if (resource === "leaves") {
    record.appliedOn = record.appliedOn || today();
    record.status = record.status || "pending";
  }
  if (resource === "clients") {
    record.addedBy = record.addedBy || req.user.name;
    record.lastUpdated = today();
  }
  if (resource === "invoices") {
    record.total = Number(record.total ?? Number(record.amount || 0) + Number(record.tax || 0));
    record.updatedOn = today();
  }
  if (resource === "payslips") {
    record.net = Number(record.net ?? Number(record.gross || 0) - Number(record.deductions || 0));
    record.paidOn = record.paidOn || (record.status === "paid" ? today() : undefined);
  }
  if (resource === "notifications") record.time = record.time || nowStamp();

  return record;
}

export const listWorkspaceRecords = asyncHandler(async (req, res) => {
  const config = getConfig(req.validated.params.resource);
  assertCanUseResource(req, req.validated.params.resource, config);
  const records = await config.model.find(scopeForUser(req, config)).sort({ createdAt: -1 });
  return success(res, records);
});

export const createWorkspaceRecord = asyncHandler(async (req, res) => {
  const resource = req.validated.params.resource;
  const config = getConfig(resource);
  assertCanUseResource(req, resource, config, true);
  const payload = await enrichCreate(req, resource, req.validated.body);
  const record = await config.model.create(payload);
  return created(res, record);
});

export const updateWorkspaceRecord = asyncHandler(async (req, res) => {
  const config = getConfig(req.validated.params.resource);
  assertCanUseResource(req, req.validated.params.resource, config, true);
  const record = await config.model.findOneAndUpdate(
    { _id: req.validated.params.id, companyId: req.user.companyId },
    { $set: clean(req.validated.body) },
    { new: true, runValidators: true },
  );
  if (!record) throw new AppError("Record not found", 404);
  return success(res, record);
});

export const deleteWorkspaceRecord = asyncHandler(async (req, res) => {
  const config = getConfig(req.validated.params.resource);
  assertCanUseResource(req, req.validated.params.resource, config, true);
  const record = await config.model.findOneAndDelete({
    _id: req.validated.params.id,
    companyId: req.user.companyId,
  });
  if (!record) throw new AppError("Record not found", 404);
  return success(res, record);
});
