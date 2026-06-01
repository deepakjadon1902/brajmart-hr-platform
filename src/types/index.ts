export type Role = "employee" | "hr" | "team-manager" | "super-admin";

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
  joinDate?: string;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  primaryColor?: string;
}

export interface Employee extends User {
  status: "active" | "inactive" | "on-leave";
  manager?: string;
  location?: string;
  salary?: number;
}

export interface AttendanceRecord {
  id: string;
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
  month: string;
  gross: number;
  deductions: number;
  net: number;
  status: "paid" | "pending";
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
