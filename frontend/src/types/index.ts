export type Role = "employee" | "hr" | "team-manager" | "super-admin" | "digital-marketing";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  companyId: string;
  department?: string;
  designation?: string;
  phone?: string;
  location?: string;
  manager?: string;
  salary?: number;
  baseSalary?: number;
  monthlyCtc?: number;
  annualCtc?: number;
  bankAccount?: string;
  joinDate?: string;
}

export interface Company {
  id: string;
  companyId?: string;
  name: string;
  logo?: string;
  primaryColor?: string;
}

export interface Employee extends User {
  status: "active" | "inactive" | "on-leave";
  password?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId?: string;
  employeeName?: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  hoursWorked?: number;
  status: "present" | "absent" | "late" | "half-day" | "leave";
  location?: { lat: number; lng: number; address?: string };
}

export interface LeaveRequest {
  id: string;
  type: "casual" | "sick" | "earned" | "unpaid";
  from: string;
  to: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  appliedOn: string;
  employeeId?: string;
  employeeName?: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: "public" | "company" | "department";
}

export interface Shift {
  id: string;
  name: "Morning" | "Evening" | "Night" | "Custom";
  start: string;
  end: string;
  employees: number;
}

export interface Payslip {
  id: string;
  employeeId?: string;
  employeeName?: string;
  month: string;
  gross: number;
  deductions: number;
  net: number;
  status: "paid" | "pending";
  paidOn?: string;
}

export interface Asset {
  id: string;
  type: "Laptop" | "ID Card" | "SIM Card" | "Headset" | "Monitor" | "Accessory";
  name: string;
  serial?: string;
  assignedOn?: string;
  status: "assigned" | "returned" | "in-repair";
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: "info" | "success" | "warning" | "danger";
}

export interface Client {
  id: string;
  name: string;
  owner: string;
  email: string;
  domain: "IT" | "Digital Marketing" | "Social Marketing" | "Email Marketing" | "WhatsApp Marketing";
  status: "continue" | "on-break" | "leave" | "new";
  addedBy: string;
  monthlyValue: number;
  lastUpdated: string;
}

export interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  domain: Client["domain"];
  month: string;
  amount: number;
  tax: number;
  total: number;
  status: "draft" | "sent" | "paid";
  template: string;
  notes: string;
  updatedOn: string;
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  employeeName: string;
  name: string;
  type: string;
  size: string;
  uploadedOn: string;
  status: "submitted" | "verified" | "needs-update";
}

export interface Message {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  subject: string;
  body: string;
  sentOn: string;
  channel: "hr" | "manager" | "team" | "employee";
  read: boolean;
}

export interface RoleAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  roleName: string;
  workScope: string;
}

export interface PermissionGrant {
  id: string;
  employeeId: string;
  employeeName: string;
  permission: string;
  granted: boolean;
}

export type TaskStatus = "not-started" | "in-progress" | "completed";

export interface Task {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  status: TaskStatus;
  dueDate?: string;
  assignedById: string;
  assignedByName: string;
  completedAt?: string;
  createdAt?: string;
}
