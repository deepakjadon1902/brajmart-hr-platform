import mongoose from "mongoose";

const baseOptions = { timestamps: true };

function withId(schema) {
  schema.virtual("id").get(function getId() {
    return this._id.toString();
  });
  schema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      delete ret._id;
      return ret;
    },
  });
  return schema;
}

const companyField = { type: String, required: true, index: true };
const employeeIdField = { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true };

export const AttendanceRecord = mongoose.model(
  "AttendanceRecord",
  withId(
    new mongoose.Schema(
      {
        companyId: companyField,
        employeeId: employeeIdField,
        employeeName: { type: String, trim: true, maxlength: 120 },
        date: { type: String, required: true, index: true },
        checkIn: String,
        checkOut: String,
        hoursWorked: { type: Number, min: 0, default: 0 },
        status: { type: String, enum: ["present", "absent", "late", "half-day", "leave"], required: true },
        location: {
          lat: Number,
          lng: Number,
          address: { type: String, trim: true, maxlength: 240 },
        },
      },
      baseOptions,
    ),
  ),
);

export const LeaveRequest = mongoose.model(
  "LeaveRequest",
  withId(
    new mongoose.Schema(
      {
        companyId: companyField,
        employeeId: employeeIdField,
        employeeName: { type: String, trim: true, maxlength: 120 },
        type: { type: String, enum: ["casual", "sick", "earned", "unpaid"], required: true },
        from: { type: String, required: true },
        to: { type: String, required: true },
        reason: { type: String, trim: true, maxlength: 1000 },
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
        appliedOn: { type: String, required: true },
      },
      baseOptions,
    ),
  ),
);

export const Holiday = mongoose.model(
  "Holiday",
  withId(
    new mongoose.Schema(
      {
        companyId: companyField,
        name: { type: String, required: true, trim: true, maxlength: 120 },
        date: { type: String, required: true, index: true },
        type: { type: String, enum: ["public", "company", "department"], required: true },
      },
      baseOptions,
    ),
  ),
);

export const Shift = mongoose.model(
  "Shift",
  withId(
    new mongoose.Schema(
      {
        companyId: companyField,
        name: { type: String, enum: ["Morning", "Evening", "Night", "Custom"], required: true },
        start: { type: String, required: true },
        end: { type: String, required: true },
        employees: { type: Number, min: 0, default: 0 },
      },
      baseOptions,
    ),
  ),
);

export const Payslip = mongoose.model(
  "Payslip",
  withId(
    new mongoose.Schema(
      {
        companyId: companyField,
        employeeId: employeeIdField,
        employeeName: { type: String, trim: true, maxlength: 120 },
        month: { type: String, required: true, index: true },
        gross: { type: Number, min: 0, required: true },
        deductions: { type: Number, min: 0, default: 0 },
        net: { type: Number, min: 0, required: true },
        status: { type: String, enum: ["paid", "pending"], default: "pending" },
        paidOn: String,
      },
      baseOptions,
    ),
  ),
);

export const Asset = mongoose.model(
  "Asset",
  withId(
    new mongoose.Schema(
      {
        companyId: companyField,
        employeeId: employeeIdField,
        type: { type: String, enum: ["Laptop", "ID Card", "SIM Card", "Headset", "Monitor", "Accessory"], required: true },
        name: { type: String, required: true, trim: true, maxlength: 160 },
        serial: { type: String, trim: true, maxlength: 120 },
        assignedOn: String,
        status: { type: String, enum: ["assigned", "returned", "in-repair"], required: true },
      },
      baseOptions,
    ),
  ),
);

export const Notification = mongoose.model(
  "Notification",
  withId(
    new mongoose.Schema(
      {
        companyId: companyField,
        employeeId: employeeIdField,
        title: { type: String, required: true, trim: true, maxlength: 160 },
        body: { type: String, required: true, trim: true, maxlength: 1200 },
        time: { type: String, required: true },
        read: { type: Boolean, default: false },
        type: { type: String, enum: ["info", "success", "warning", "danger"], default: "info" },
      },
      baseOptions,
    ),
  ),
);

export const Client = mongoose.model(
  "Client",
  withId(
    new mongoose.Schema(
      {
        companyId: companyField,
        name: { type: String, required: true, trim: true, maxlength: 160 },
        owner: { type: String, required: true, trim: true, maxlength: 120 },
        email: { type: String, required: true, lowercase: true, trim: true, maxlength: 255 },
        domain: {
          type: String,
          enum: ["IT", "Digital Marketing", "Social Marketing", "Email Marketing", "WhatsApp Marketing"],
          required: true,
        },
        status: { type: String, enum: ["continue", "on-break", "leave", "new"], default: "new" },
        addedBy: { type: String, trim: true, maxlength: 120 },
        monthlyValue: { type: Number, min: 0, default: 0 },
        lastUpdated: { type: String, required: true },
      },
      baseOptions,
    ),
  ),
);

export const Invoice = mongoose.model(
  "Invoice",
  withId(
    new mongoose.Schema(
      {
        companyId: companyField,
        clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true, index: true },
        clientName: { type: String, required: true, trim: true, maxlength: 160 },
        domain: { type: String, required: true, trim: true, maxlength: 80 },
        month: { type: String, required: true },
        amount: { type: Number, min: 0, required: true },
        tax: { type: Number, min: 0, default: 0 },
        total: { type: Number, min: 0, required: true },
        status: { type: String, enum: ["draft", "sent", "paid"], default: "draft" },
        template: { type: String, trim: true, maxlength: 2000 },
        notes: { type: String, trim: true, maxlength: 2000 },
        updatedOn: { type: String, required: true },
      },
      baseOptions,
    ),
  ),
);

export const RoleAssignment = mongoose.model(
  "RoleAssignment",
  withId(
    new mongoose.Schema(
      {
        companyId: companyField,
        employeeId: employeeIdField,
        employeeName: { type: String, required: true, trim: true, maxlength: 120 },
        roleName: { type: String, required: true, trim: true, maxlength: 120 },
        workScope: { type: String, required: true, trim: true, maxlength: 1000 },
      },
      baseOptions,
    ),
  ),
);

export const PermissionGrant = mongoose.model(
  "PermissionGrant",
  withId(
    new mongoose.Schema(
      {
        companyId: companyField,
        employeeId: employeeIdField,
        employeeName: { type: String, required: true, trim: true, maxlength: 120 },
        permission: { type: String, required: true, trim: true, maxlength: 160 },
        granted: { type: Boolean, default: false },
      },
      baseOptions,
    ),
  ),
);
