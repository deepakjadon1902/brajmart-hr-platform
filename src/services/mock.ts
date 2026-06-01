// Lightweight mock data used by the UI when no backend is connected.
import type {
  Employee, AttendanceRecord, LeaveRequest, Holiday, Shift, Payslip, Asset, Notification, Company,
} from "@/types";

export const companies: Company[] = [
  { id: "c1", name: "Acme Corporation", primaryColor: "#4F46E5" },
  { id: "c2", name: "Globex Industries", primaryColor: "#0EA5E9" },
  { id: "c3", name: "Initech Labs", primaryColor: "#10B981" },
];

export const employees: Employee[] = Array.from({ length: 24 }).map((_, i) => ({
  id: `e${i + 1}`,
  name: ["Aarav Sharma","Priya Verma","Rahul Mehta","Sneha Iyer","Vikram Singh","Ishita Roy","Aditya Khanna","Neha Joshi","Karan Patel","Megha Kapoor","Rohan Das","Anjali Nair"][i % 12] + ` ${i+1}`,
  email: `user${i + 1}@acme.com`,
  role: "employee",
  companyId: "c1",
  department: ["Engineering","Design","HR","Sales","Finance"][i % 5],
  designation: ["Engineer II","Senior Designer","HR Partner","AE","Analyst"][i % 5],
  joinDate: `2023-${String((i % 12) + 1).padStart(2,"0")}-15`,
  status: (["active","active","active","on-leave","inactive"] as const)[i % 5],
  manager: "Rohan Das",
  location: ["Bengaluru","Mumbai","Pune","Delhi","Remote"][i % 5],
  salary: 60000 + i * 2500,
}));

export const attendance: AttendanceRecord[] = Array.from({ length: 30 }).map((_, i) => {
  const d = new Date(); d.setDate(d.getDate() - i);
  return {
    id: `a${i}`,
    date: d.toISOString().slice(0, 10),
    checkIn: "09:1" + (i % 9),
    checkOut: "18:0" + (i % 9),
    hoursWorked: 8 + ((i % 3) * 0.25),
    status: (["present","present","late","present","half-day"] as const)[i % 5],
  };
});

export const leaves: LeaveRequest[] = [
  { id: "l1", type: "casual", from: "2025-06-10", to: "2025-06-12", reason: "Family function", status: "approved", appliedOn: "2025-06-01", employeeId: "e1", employeeName: "Aarav Sharma 1" },
  { id: "l2", type: "sick", from: "2025-06-18", to: "2025-06-19", reason: "Fever", status: "pending", appliedOn: "2025-06-17", employeeId: "e2", employeeName: "Priya Verma 2" },
  { id: "l3", type: "earned", from: "2025-07-01", to: "2025-07-05", reason: "Vacation", status: "pending", appliedOn: "2025-06-20", employeeId: "e3", employeeName: "Rahul Mehta 3" },
  { id: "l4", type: "casual", from: "2025-05-20", to: "2025-05-20", reason: "Personal", status: "rejected", appliedOn: "2025-05-18", employeeId: "e4", employeeName: "Sneha Iyer 4" },
];

export const holidays: Holiday[] = [
  { id: "h1", name: "Republic Day", date: "2026-01-26", type: "public" },
  { id: "h2", name: "Holi", date: "2026-03-04", type: "public" },
  { id: "h3", name: "Founders Day", date: "2026-04-12", type: "company" },
  { id: "h4", name: "Independence Day", date: "2026-08-15", type: "public" },
  { id: "h5", name: "Diwali", date: "2026-10-29", type: "public" },
  { id: "h6", name: "Engineering Offsite", date: "2026-11-20", type: "department" },
];

export const shifts: Shift[] = [
  { id: "s1", name: "Morning", start: "06:00", end: "14:00", employees: 18 },
  { id: "s2", name: "Evening", start: "14:00", end: "22:00", employees: 12 },
  { id: "s3", name: "Night",   start: "22:00", end: "06:00", employees: 6 },
  { id: "s4", name: "Custom",  start: "10:00", end: "19:00", employees: 32 },
];

export const payslips: Payslip[] = Array.from({ length: 8 }).map((_, i) => {
  const d = new Date(); d.setMonth(d.getMonth() - i);
  return {
    id: `p${i}`,
    month: d.toLocaleString("en", { month: "long", year: "numeric" }),
    gross: 95000,
    deductions: 12500,
    net: 82500,
    status: i === 0 ? "pending" : "paid",
  };
});

export const assets: Asset[] = [
  { id: "as1", type: "Laptop", name: "MacBook Pro 14\"", serial: "C02XF1234", assignedOn: "2024-01-15", status: "assigned" },
  { id: "as2", type: "ID Card", name: "Employee Badge", serial: "ID-00921", assignedOn: "2024-01-15", status: "assigned" },
  { id: "as3", type: "SIM Card", name: "Airtel Postpaid", serial: "9899XXXXXX", assignedOn: "2024-01-16", status: "assigned" },
  { id: "as4", type: "Headset", name: "Sony WH-1000XM5", assignedOn: "2024-02-01", status: "assigned" },
  { id: "as5", type: "Monitor", name: "Dell U2723QE 27\"", assignedOn: "2024-02-10", status: "in-repair" },
  { id: "as6", type: "Accessory", name: "Logitech MX Master 3S", assignedOn: "2024-02-10", status: "assigned" },
];

export const notifications: Notification[] = [
  { id: "n1", title: "Leave approved", body: "Your casual leave for Jun 10-12 has been approved.", time: "2h ago", read: false, type: "success" },
  { id: "n2", title: "Payslip available", body: "Your May 2026 payslip is ready to download.", time: "1d ago", read: false, type: "info" },
  { id: "n3", title: "Policy update", body: "Updated WFH policy effective from next month.", time: "3d ago", read: true, type: "warning" },
];
