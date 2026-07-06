import {
  LayoutDashboard,
  User,
  CalendarDays,
  FileText,
  Briefcase,
  Bell,
  MessageSquare,
  Settings,
  Users,
  ClipboardList,
  Award,
  UserPlus,
  Building2,
  ShieldCheck,
  BarChart3,
  Mail,
  Megaphone,
  Calendar,
  Wallet,
  Package,
  LogOut,
  Workflow,
  ListChecks,
  Activity,
  Globe,
  ReceiptText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "@/types";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV: Record<Role, NavItem[]> = {
  employee: [
    { to: "/employee/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/employee/profile", label: "Profile", icon: User },
    { to: "/employee/attendance", label: "Attendance", icon: Activity },
    { to: "/employee/leaves", label: "Leave Requests", icon: CalendarDays },
    { to: "/employee/holidays", label: "Holidays", icon: Calendar },
    { to: "/employee/payslips", label: "Payslips", icon: Wallet },
    { to: "/employee/documents", label: "Documents", icon: FileText },
    { to: "/employee/messages", label: "Messages", icon: MessageSquare },
  ],
  hr: [
    { to: "/hr/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/employee/dashboard", label: "Employee Portal", icon: User },
    { to: "/team-manager/dashboard", label: "Team Manager Portal", icon: ClipboardList },
    { to: "/hr/employees", label: "Employees", icon: Users },
    { to: "/hr/clients", label: "Clients", icon: Building2 },
    { to: "/hr/attendance", label: "Attendance", icon: Activity },
    { to: "/hr/leaves", label: "Leave Approval", icon: CalendarDays },
    { to: "/hr/recruitment", label: "Recruitment", icon: UserPlus },
    { to: "/hr/interviews", label: "Interviews", icon: Briefcase },
    { to: "/hr/performance", label: "Performance", icon: Award },
    { to: "/hr/onboarding", label: "Onboarding", icon: ListChecks },
    { to: "/hr/exit", label: "Exit", icon: LogOut },
    { to: "/hr/assets", label: "Assets", icon: Package },
    { to: "/hr/holidays", label: "Holidays", icon: Calendar },
    { to: "/hr/shifts", label: "Shifts", icon: Workflow },
    { to: "/hr/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/hr/reports", label: "Reports", icon: FileText },
    { to: "/hr/mail", label: "Mail Center", icon: Mail },
    { to: "/hr/announcements", label: "Announcements", icon: Megaphone },
    { to: "/hr/settings", label: "Settings", icon: Settings },
  ],
  "team-manager": [
    { to: "/team-manager/dashboard", label: "Team Dashboard", icon: LayoutDashboard },
    { to: "/team-manager/attendance", label: "Team Attendance", icon: Activity },
    { to: "/team-manager/leaves", label: "Team Leaves", icon: CalendarDays },
    { to: "/team-manager/tasks", label: "Tasks", icon: ClipboardList },
    { to: "/team-manager/performance", label: "Performance", icon: Award },
    { to: "/team-manager/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/team-manager/settings", label: "Settings", icon: Settings },
  ],
  "super-admin": [
    { to: "/super-admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/employee/dashboard", label: "Employee Portal", icon: User },
    { to: "/hr/dashboard", label: "HR Portal", icon: Users },
    { to: "/team-manager/dashboard", label: "Team Manager Portal", icon: ClipboardList },
    { to: "/super-admin/companies", label: "Companies", icon: Building2 },
    { to: "/super-admin/roles", label: "Roles", icon: ShieldCheck },
    { to: "/super-admin/permissions", label: "Permissions", icon: ShieldCheck },
    { to: "/super-admin/users", label: "Users", icon: Users },
    { to: "/digital-marketing/dashboard", label: "Digital Marketing", icon: Megaphone },
    { to: "/super-admin/salary", label: "Salary", icon: Wallet },
    { to: "/super-admin/audit", label: "Audit Logs", icon: FileText },
    { to: "/super-admin/system", label: "System Logs", icon: Activity },
    { to: "/super-admin/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/super-admin/localization", label: "Localization", icon: Globe },
    { to: "/super-admin/settings", label: "Settings", icon: Settings },
  ],
  "digital-marketing": [
    { to: "/digital-marketing/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/digital-marketing/clients", label: "Clients", icon: Users },
    { to: "/digital-marketing/invoices", label: "Invoices", icon: ReceiptText },
  ],
};

export const ROLE_META: Record<
  Role,
  { title: string; accent: string; loginPath: string; home: string }
> = {
  employee: {
    title: "Employee Portal",
    accent: "from-indigo-500 to-violet-500",
    loginPath: "/employee/login",
    home: "/employee/dashboard",
  },
  hr: {
    title: "HR Portal",
    accent: "from-emerald-500 to-teal-500",
    loginPath: "/hr/login",
    home: "/hr/dashboard",
  },
  "team-manager": {
    title: "Team Manager Portal",
    accent: "from-sky-500 to-cyan-500",
    loginPath: "/team-manager/login",
    home: "/team-manager/dashboard",
  },
  "super-admin": {
    title: "Super Admin Portal",
    accent: "from-rose-500 to-fuchsia-500",
    loginPath: "/super-admin/login",
    home: "/super-admin/dashboard",
  },
  "digital-marketing": {
    title: "Digital Marketing Portal",
    accent: "from-amber-500 to-rose-500",
    loginPath: "/digital-marketing/login",
    home: "/digital-marketing/dashboard",
  },
};
