import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  assets,
  attendance,
  clients,
  employees,
  employeeDocuments,
  holidays,
  invoices,
  leaves,
  messages,
  notifications,
  payslips,
  permissionGrants,
  roleAssignments,
  shifts,
} from "@/services/mock";
import type {
  Asset,
  AttendanceRecord,
  Client,
  Employee,
  EmployeeDocument,
  Holiday,
  Invoice,
  LeaveRequest,
  Message,
  Notification,
  PermissionGrant,
  Payslip,
  RoleAssignment,
  Shift,
} from "@/types";

type NewEmployee = Omit<Employee, "id" | "role" | "companyId" | "status" | "joinDate"> &
  Partial<Pick<Employee, "id" | "role" | "companyId" | "status" | "joinDate">>;

interface WorkspaceState {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  holidays: Holiday[];
  shifts: Shift[];
  payslips: Payslip[];
  assets: Asset[];
  notifications: Notification[];
  clients: Client[];
  invoices: Invoice[];
  documents: EmployeeDocument[];
  messages: Message[];
  roleAssignments: RoleAssignment[];
  permissionGrants: PermissionGrant[];
}

const today = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);
const nowStamp = () => {
  const d = new Date();
  return `${d.toISOString().slice(0, 10)} ${d.toTimeString().slice(0, 5)}`;
};

const attendanceWithEmployees = employees.map((employee, index) => {
  const source = attendance[index % attendance.length];
  return {
    ...source,
    id: `${source.id}-${employee.id}`,
    employeeId: employee.id,
    employeeName: employee.name,
  };
});

const defaultState: WorkspaceState = {
  employees,
  attendance: attendanceWithEmployees,
  leaves,
  holidays,
  shifts,
  payslips,
  assets,
  notifications,
  clients,
  invoices,
  documents: employeeDocuments,
  messages,
  roleAssignments,
  permissionGrants,
};

const loadState = (): WorkspaceState => {
  try {
    const raw = localStorage.getItem("workspace_state");
    return raw ? { ...defaultState, ...(JSON.parse(raw) as Partial<WorkspaceState>) } : defaultState;
  } catch {
    return defaultState;
  }
};

const initialState = loadState();

const slice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    addEmployee(state, action: PayloadAction<NewEmployee>) {
      const employee: Employee = {
        ...action.payload,
        id: action.payload.id ?? `e${Date.now()}`,
        role: action.payload.role ?? "employee",
        companyId: action.payload.companyId ?? "c1",
        status: action.payload.status ?? "active",
        joinDate: action.payload.joinDate ?? today(),
      };

      state.employees.unshift(employee);
    },
    addClient(
      state,
      action: PayloadAction<Omit<Client, "id" | "lastUpdated" | "addedBy"> & { addedBy?: string }>,
    ) {
      state.clients.unshift({
        ...action.payload,
        id: `client-${Date.now()}`,
        addedBy: action.payload.addedBy ?? "HR",
        lastUpdated: today(),
      });
    },
    upsertInvoice(state, action: PayloadAction<Partial<Invoice> & Pick<Invoice, "clientId">>) {
      const client = state.clients.find((item) => item.id === action.payload.clientId);
      const amount = Number(action.payload.amount ?? client?.monthlyValue ?? 0);
      const tax = Number(action.payload.tax ?? Math.round(amount * 0.18));
      const existing = action.payload.id
        ? state.invoices.find((item) => item.id === action.payload.id)
        : undefined;
      const invoice: Invoice = {
        id: action.payload.id ?? `invoice-${Date.now()}`,
        clientId: action.payload.clientId,
        clientName: action.payload.clientName ?? client?.name ?? "Client",
        domain: action.payload.domain ?? client?.domain ?? "Digital Marketing",
        month: action.payload.month ?? "June 2026",
        amount,
        tax,
        total: amount + tax,
        status: action.payload.status ?? "draft",
        template: action.payload.template ?? `${client?.domain ?? "Marketing"} invoice`,
        notes: action.payload.notes ?? "Professional service invoice.",
        updatedOn: today(),
      };

      if (existing) Object.assign(existing, invoice);
      else state.invoices.unshift(invoice);
    },
    markAttendance(
      state,
      action: PayloadAction<{
        employeeId: string;
        employeeName?: string;
        location?: AttendanceRecord["location"];
      }>,
    ) {
      const date = today();
      const employee = state.employees.find((item) => item.id === action.payload.employeeId);
      const existing = state.attendance.find(
        (item) => item.employeeId === action.payload.employeeId && item.date === date,
      );

      if (existing?.checkIn && !existing.checkOut) {
        existing.checkOut = nowTime();
        existing.hoursWorked = Math.max(existing.hoursWorked ?? 8, 8);
        existing.status = "present";
        state.messages.unshift({
          id: `msg-att-${Date.now()}`,
          fromId: action.payload.employeeId,
          fromName: action.payload.employeeName ?? employee?.name ?? "Employee",
          toId: "hr",
          toName: "HR Team",
          subject: "Attendance checkout",
          body: `${action.payload.employeeName ?? employee?.name ?? "Employee"} checked out on ${date} at ${existing.checkOut}.`,
          sentOn: nowStamp(),
          channel: "employee",
          read: false,
        });
        return;
      }

      if (existing) {
        existing.checkIn = nowTime();
        existing.checkOut = undefined;
        existing.hoursWorked = 0;
        existing.status = "present";
        existing.location = action.payload.location;
        state.messages.unshift({
          id: `msg-att-${Date.now()}`,
          fromId: action.payload.employeeId,
          fromName: action.payload.employeeName ?? employee?.name ?? "Employee",
          toId: "hr",
          toName: "HR Team",
          subject: "Attendance checkin",
          body: `${action.payload.employeeName ?? employee?.name ?? "Employee"} checked in on ${date} at ${existing.checkIn}.`,
          sentOn: nowStamp(),
          channel: "employee",
          read: false,
        });
        return;
      }

      state.attendance.unshift({
        id: `att-${action.payload.employeeId}-${Date.now()}`,
        employeeId: action.payload.employeeId,
        employeeName: action.payload.employeeName ?? employee?.name ?? "Employee",
        date,
        checkIn: nowTime(),
        hoursWorked: 0,
        status: "present",
        location: action.payload.location,
      });

      state.messages.unshift({
        id: `msg-att-${Date.now()}`,
        fromId: action.payload.employeeId,
        fromName: action.payload.employeeName ?? employee?.name ?? "Employee",
        toId: "hr",
        toName: "HR Team",
        subject: "Attendance update",
        body: `${action.payload.employeeName ?? employee?.name ?? "Employee"} checked in on ${date} at ${nowTime()}.`,
        sentOn: nowStamp(),
        channel: "employee",
        read: false,
      });
    },
    applyLeave(
      state,
      action: PayloadAction<{
        employeeId: string;
        employeeName: string;
        type: LeaveRequest["type"];
        from: string;
        to: string;
        reason: string;
      }>,
    ) {
      state.leaves.unshift({
        ...action.payload,
        id: `leave-${Date.now()}`,
        status: "pending",
        appliedOn: today(),
      });
      state.messages.unshift({
        id: `msg-leave-${Date.now()}`,
        fromId: action.payload.employeeId,
        fromName: action.payload.employeeName,
        toId: "hr",
        toName: "HR Team",
        subject: "Leave request",
        body: `${action.payload.employeeName} requested ${action.payload.type} leave from ${action.payload.from} to ${action.payload.to}.`,
        sentOn: nowStamp(),
        channel: "employee",
        read: false,
      });
    },
    updateLeaveStatus(
      state,
      action: PayloadAction<{ id: string; status: LeaveRequest["status"] }>,
    ) {
      const leave = state.leaves.find((item) => item.id === action.payload.id);
      if (!leave) return;

      leave.status = action.payload.status;
      const employee = state.employees.find((item) => item.id === leave.employeeId);
      if (employee) {
        employee.status = action.payload.status === "approved" ? "on-leave" : "active";
      }
      state.messages.unshift({
        id: `msg-leave-status-${Date.now()}`,
        fromId: "hr",
        fromName: "HR Team",
        toId: leave.employeeId ?? "employee",
        toName: leave.employeeName ?? "Employee",
        subject: "Leave status updated",
        body: `Your ${leave.type} leave from ${leave.from} to ${leave.to} was ${action.payload.status}.`,
        sentOn: nowStamp(),
        channel: "hr",
        read: false,
      });
    },
    addDocument(
      state,
      action: PayloadAction<{
        employeeId: string;
        employeeName: string;
        name: string;
        type: string;
        size?: string;
      }>,
    ) {
      state.documents.unshift({
        id: `doc-${Date.now()}`,
        employeeId: action.payload.employeeId,
        employeeName: action.payload.employeeName,
        name: action.payload.name,
        type: action.payload.type,
        size: action.payload.size ?? "Uploaded",
        uploadedOn: today(),
        status: "submitted",
      });
    },
    updateDocumentStatus(
      state,
      action: PayloadAction<{ id: string; status: EmployeeDocument["status"] }>,
    ) {
      const document = state.documents.find((item) => item.id === action.payload.id);
      if (document) document.status = action.payload.status;
    },
    sendMessage(
      state,
      action: PayloadAction<Omit<Message, "id" | "sentOn" | "read"> & Partial<Pick<Message, "read">>>,
    ) {
      state.messages.unshift({
        ...action.payload,
        id: `message-${Date.now()}`,
        sentOn: nowStamp(),
        read: action.payload.read ?? false,
      });
    },
    paySalary(
      state,
      action: PayloadAction<{ employeeId: string; month: string; deductions?: number }>,
    ) {
      const employee = state.employees.find((item) => item.id === action.payload.employeeId);
      if (!employee) return;
      const gross = employee.monthlyCtc ?? employee.salary ?? 0;
      const deductions = Number(action.payload.deductions ?? Math.round(gross * 0.08));
      const net = Math.max(0, gross - deductions);
      state.payslips.unshift({
        id: `pay-${employee.id}-${Date.now()}`,
        employeeId: employee.id,
        employeeName: employee.name,
        month: action.payload.month,
        gross,
        deductions,
        net,
        status: "paid",
        paidOn: today(),
      });
      state.messages.unshift({
        id: `msg-salary-${Date.now()}`,
        fromId: "super-admin",
        fromName: "Super Admin",
        toId: employee.id,
        toName: employee.name,
        subject: `Salary paid for ${action.payload.month}`,
        body: `Salary released. Gross: INR ${gross.toLocaleString()}, deductions: INR ${deductions.toLocaleString()}, net pay: INR ${net.toLocaleString()}. Payslip is available in your portal.`,
        sentOn: nowStamp(),
        channel: "hr",
        read: false,
      });
    },
    setPermissionGrant(state, action: PayloadAction<{ id: string; granted: boolean }>) {
      const grant = state.permissionGrants.find((item) => item.id === action.payload.id);
      if (grant) grant.granted = action.payload.granted;
    },
  },
});

export const {
  addClient,
  addDocument,
  addEmployee,
  applyLeave,
  markAttendance,
  paySalary,
  sendMessage,
  setPermissionGrant,
  updateDocumentStatus,
  updateLeaveStatus,
  upsertInvoice,
} = slice.actions;
export default slice.reducer;
