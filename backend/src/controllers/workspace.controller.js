import { z } from "zod";
import {
  Asset,
  Company,
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
  Task,
} from "../models/PortalData.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { created, success } from "../utils/http.js";
import { canAccessPortal } from "../utils/portalAccess.js";
import { syncPendingTaskNotifications, taskDeadlineFields, updateTaskNotifications } from "../services/task-notifications.service.js";
import { isPeopleAdmin, isTeamManager, managedMemberIds, canManageMember, requireManagedMember } from "../services/teams.service.js";

const taskStatusSchema = z.enum(["not-started", "in-progress", "completed"]);
const taskFieldsSchema = z.object({
  employeeId: z.string().regex(/^[a-f\d]{24}$/i, "Select a valid employee"),
  title: z.string().trim().min(1, "Task title is required").max(180),
  description: z.string().trim().max(2000).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueTime: z.string().regex(/^$|^(?:[01]\d|2[0-3]):[0-5]\d$/, "Enter a valid due time").optional(),
  dueDate: z.string().trim().refine(
    (value) => value === "" || (
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value
    ),
    "Enter a valid due date",
  ).optional(),
});

function parseTask(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new AppError(result.error.issues[0].message, 400, result.error.flatten());
  }
  return result.data;
}

async function taskEmployee(employeeId, companyId) {
  const employee = await User.findOne({ _id: employeeId, companyId, status: { $ne: "inactive" } });
  if (!employee) throw new AppError("Active employee not found in this company", 404);
  if (!canAccessPortal(employee, "employee")) {
    throw new AppError("Select an employee with access to the employee portal", 400);
  }
  return employee;
}

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const nowTime = () => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
const minutesFromTime = (value) => {
  const [hours, minutes] = String(value || "")
    .split(":")
    .map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};
const hoursBetweenTimes = (start, end) => {
  const startMinutes = minutesFromTime(start);
  const endMinutes = minutesFromTime(end);
  if (startMinutes === null || endMinutes === null) return 0;
  const diff = endMinutes >= startMinutes ? endMinutes - startMinutes : endMinutes + 24 * 60 - startMinutes;
  return Math.round((diff / 60) * 100) / 100;
};
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
  tasks: { model: Task, employeeScoped: true, roles: ["employee", "hr", "team-manager", "super-admin"] },
  companies: { model: Company, roles: ["super-admin"], global: true },
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

function selectedCompanyId(req) {
  if (req.user.role !== "super-admin") return req.user.companyId;
  const requested = String(req.headers["x-company-id"] || req.query.companyId || "").trim();
  return requested || req.user.companyId;
}

function assertCanUseResource(req, resource, config, operation = "read") {
  if (config.roles && !config.roles.includes(req.user.role)) {
    throw new AppError("You do not have permission to access this portal data", 403);
  }
  if (resource === "tasks") {
    if (operation !== "read" && operation !== "update" && !canAccessPortal(req.user, "team-manager")) {
      throw new AppError("You do not have permission to assign or delete tasks", 403);
    }
    return;
  }
  if (resource === "notifications" && operation === "update") return;
  const employeeWritable = canAccessPortal(req.user, "employee") && (
    (["attendance", "leaves"].includes(resource) && operation === "create") ||
    (resource === "attendance" && operation === "update") ||
    (resource === "leaves" && operation === "update" && canAccessPortal(req.user, "team-manager"))
  );
  if (operation !== "read" && !employeeWritable && !["hr", "super-admin", "digital-marketing"].includes(req.user.role)) {
    throw new AppError("You do not have permission to manage this portal data", 403);
  }
}

async function scopeForUser(req, config, resource) {
  if (config.global) return {};
  if (resource === "notifications") return { companyId: req.user.companyId, employeeId: req.user.id };
  const filter = { companyId: selectedCompanyId(req) };
  if (config.employeeScoped && !isPeopleAdmin(req.user)) {
    filter.employeeId = isTeamManager(req.user) && ["attendance", "leaves", "tasks"].includes(resource)
      ? { $in: [req.user._id, ...await managedMemberIds(req.user, filter.companyId)] }
      : req.user.id;
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
  if (resource === "tasks") {
    const task = parseTask(taskFieldsSchema, body);
    const companyId = selectedCompanyId(req);
    const employee = await taskEmployee(task.employeeId, companyId);
    await requireManagedMember(req.user, employee.id, companyId);
    return {
      ...task,
      ...taskDeadlineFields(task),
      companyId,
      employeeName: employee.name,
      status: "not-started",
      priority: task.priority || "medium",
      assignedById: req.user.id,
      assignedByName: req.user.name,
    };
  }
  const record = clean(body);
  if (resource === "companies") {
    record.companyId = String(body.companyId || `c${Date.now()}`).trim();
    record.createdBy = req.user.id;
    return record;
  }
  record.companyId = selectedCompanyId(req);

  if (["attendance", "leaves", "payslips", "assets", "notifications", "roleAssignments", "permissionGrants"].includes(resource)) {
    record.employeeId = record.employeeId || req.user.id;
    if (!isPeopleAdmin(req.user) && ["attendance", "leaves"].includes(resource)) record.employeeId = req.user.id;
    else if (req.user.role === "employee") record.employeeId = req.user.id;
    const employee = await User.findOne({ _id: record.employeeId, companyId: record.companyId });
    if (!employee) throw new AppError("Employee not found", 404);
    record.employeeName = employee.name;
  }

  if (resource === "attendance") {
    record.date = record.date || today();
    record.checkIn = record.checkIn || nowTime();
    if (record.checkIn && record.checkOut) {
      record.hoursWorked = hoursBetweenTimes(record.checkIn, record.checkOut);
    }
    record.status = record.status || "present";
  }
  if (resource === "leaves") {
    record.appliedOn = record.appliedOn || today();
    record.status = isPeopleAdmin(req.user) ? record.status || "pending" : "pending";
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
  const resource = req.validated.params.resource;
  const config = getConfig(resource);
  assertCanUseResource(req, resource, config);
  if (resource === "notifications") {
    await syncPendingTaskNotifications({ companyId: req.user.companyId, employeeId: req.user.id });
  }
  const records = await config.model.find(await scopeForUser(req, config, resource)).sort({ createdAt: -1 });
  return success(res, records);
});

export const createWorkspaceRecord = asyncHandler(async (req, res) => {
  const resource = req.validated.params.resource;
  const config = getConfig(resource);
  assertCanUseResource(req, resource, config, "create");
  const payload = await enrichCreate(req, resource, req.validated.body);
  const record = await config.model.create(payload);
  if (resource === "tasks") {
    // The saved task is a durable retry source if notification delivery is temporarily unavailable.
    try { await updateTaskNotifications(record); }
    catch (error) { console.error("Task saved; notification will be retried:", error.message); }
  }
  return created(res, record);
});

export const updateWorkspaceRecord = asyncHandler(async (req, res) => {
  const resource = req.validated.params.resource;
  const config = getConfig(resource);
  assertCanUseResource(req, resource, config, "update");
  if (resource === "notifications") {
    const patch = parseTask(z.object({ read: z.boolean() }).strict(), req.validated.body);
    const notification = await Notification.findOneAndUpdate(
      { _id: req.validated.params.id, ...await scopeForUser(req, config, resource) },
      { $set: patch }, { new: true, runValidators: true },
    );
    if (!notification) throw new AppError("Notification not found", 404);
    return success(res, notification);
  }
  if (resource === "leaves") {
    const patch = parseTask(z.object({ status: z.enum(["approved", "rejected"]) }).strict(), req.validated.body);
    const existing = await LeaveRequest.findOne({ _id: req.validated.params.id, ...await scopeForUser(req, config, resource) });
    if (!existing) throw new AppError("Leave request not found", 404);
    await requireManagedMember(req.user, existing.employeeId, existing.companyId);
    const record = await LeaveRequest.findOneAndUpdate(
      { _id: existing._id, companyId: existing.companyId, status: "pending" },
      { $set: { ...patch, reviewedById: req.user.id, reviewedByName: req.user.name, reviewedAt: new Date() } },
      { new: true, runValidators: true },
    );
    if (!record) throw new AppError("This leave request has already been reviewed", 409);
    return success(res, record);
  }
  let patch = clean(req.validated.body);
  const update = { $set: patch };
  let previousTask;
  if (resource === "tasks") {
    const existing = await config.model.findOne({
      _id: req.validated.params.id,
      ...await scopeForUser(req, config, resource),
    });
    if (!existing) throw new AppError("Record not found", 404);
    previousTask = existing;
    const isAssignee = String(existing.employeeId) === req.user.id;
    const canManage = await canManageMember(req.user, existing.employeeId, existing.companyId);
    if (!isAssignee && !canManage) {
      throw new AppError("You do not have permission to update this task", 403);
    }
    patch = parseTask(
      canManage
        ? taskFieldsSchema.partial().extend({ status: taskStatusSchema.optional() }).strict()
        : z.object({ status: taskStatusSchema }).strict(),
      req.validated.body,
    );
    if (!Object.keys(patch).length) throw new AppError("Provide task fields to update", 400);
    if (patch.employeeId) {
      const employee = await taskEmployee(patch.employeeId, existing.companyId);
      await requireManagedMember(req.user, employee.id, existing.companyId);
      patch.employeeName = employee.name;
      if (String(existing.employeeId) !== patch.employeeId) {
        patch.assignmentNotified = false;
        patch.assignmentVersion = (existing.assignmentVersion || 1) + 1;
        patch.lastReminderKey = null;
      }
    }
    if (patch.dueDate !== undefined || patch.dueTime !== undefined) {
      Object.assign(patch, taskDeadlineFields({
        dueDate: patch.dueDate ?? existing.dueDate,
        dueTime: patch.dueTime ?? (patch.dueDate === "" ? "" : existing.dueTime),
      }));
      patch.lastReminderKey = null;
    }
    if (patch.status === "completed" && existing.status !== "completed") patch.completedAt = new Date();
    if (patch.status && patch.status !== "completed") update.$unset = { completedAt: 1 };
    update.$set = patch;
  }
  if (resource === "attendance") {
    const existing = await config.model.findOne({
      _id: req.validated.params.id,
      companyId: selectedCompanyId(req),
    });
    if (!existing) throw new AppError("Record not found", 404);
    const isAssignee = String(existing.employeeId) === req.user.id;
    const canManage = isPeopleAdmin(req.user);
    if (!isAssignee && !canManage) {
      throw new AppError("You do not have permission to update this attendance", 403);
    }
    if (!canManage) {
      delete patch.employeeId;
      delete patch.employeeName;
    }
    const checkIn = patch.checkIn || existing.checkIn;
    const checkOut = patch.checkOut || existing.checkOut;
    if (checkIn && checkOut) patch.hoursWorked = hoursBetweenTimes(checkIn, checkOut);
  }
  const filter = {
    _id: req.validated.params.id,
    ...(config.global ? {} : { companyId: selectedCompanyId(req) }),
    ...(config.employeeScoped ? await scopeForUser(req, config, resource) : {}),
  };
  const record = await config.model.findOneAndUpdate(
    filter,
    update,
    { new: true, runValidators: true },
  );
  if (!record) throw new AppError("Record not found", 404);
  if (resource === "tasks") {
    try { await updateTaskNotifications(record, previousTask); }
    catch (error) { console.error("Task updated; notification will be retried:", error.message); }
  }
  return success(res, record);
});

export const deleteWorkspaceRecord = asyncHandler(async (req, res) => {
  const resource = req.validated.params.resource;
  const config = getConfig(resource);
  assertCanUseResource(req, resource, config, "delete");
  const scope = await scopeForUser(req, config, resource);
  if (resource === "tasks" && isTeamManager(req.user)) scope.employeeId = { $in: await managedMemberIds(req.user, selectedCompanyId(req)) };
  const record = await config.model.findOneAndDelete({
    _id: req.validated.params.id,
    ...scope,
  });
  if (!record) throw new AppError("Record not found", 404);
  if (req.validated.params.resource === "tasks") await Notification.deleteMany({ taskId: record._id });
  return success(res, record);
});
