import type { Role, User } from "@/types";
import { api } from "./api";

// Demo credentials accepted by the mocked login service.
// Real implementations should swap this for an API call.
const DEMO_USERS: Record<Role, User> = {
  employee: {
    id: "e1",
    name: "Aarav Sharma 1",
    email: "user1@brajmart.com",
    role: "employee",
    companyId: "c1",
    department: "Engineering",
    designation: "Engineer II",
  },
  hr: {
    id: "u2",
    name: "Priya Verma",
    email: "hr@demo.com",
    role: "hr",
    companyId: "c1",
    department: "People",
    designation: "HR Partner",
  },
  "team-manager": {
    id: "u3",
    name: "Vikram Singh",
    email: "manager@demo.com",
    role: "team-manager",
    companyId: "c1",
    department: "Engineering",
    designation: "Engineering Manager",
  },
  "super-admin": {
    id: "u4",
    name: "Megha Kapoor",
    email: "admin@demo.com",
    role: "super-admin",
    companyId: "c1",
    department: "Executive",
    designation: "Platform Admin",
  },
  "digital-marketing": {
    id: "u5",
    name: "Kavya Bansal",
    email: "marketing@demo.com",
    role: "digital-marketing",
    companyId: "c1",
    department: "Digital Marketing",
    designation: "Marketing Admin",
  },
};

export const authService = {
  async login(
    role: Role,
    email: string,
    password: string,
  ): Promise<{ user: User; token: string }> {
    try {
      const { data } = await api.post("/auth/login", { role, email, password });
      return data.data;
    } catch (error) {
      if (import.meta.env.PROD) throw error;
    }

    await new Promise((r) => setTimeout(r, 300));
    if (role === "employee") {
      try {
        const raw = localStorage.getItem("workspace_state");
        const workspace = raw ? JSON.parse(raw) : null;
        const employee = workspace?.employees?.find(
          (item: User & { password?: string }) =>
            item.email?.toLowerCase() === email.toLowerCase() &&
            (!item.password || item.password === password),
        );
        if (employee) {
          const token = btoa(`${employee.id}.${role}.${Date.now()}`);
          return { user: { ...employee, role: "employee" }, token };
        }
      } catch {
        // Fall back to the demo user below.
      }
    }
    const user = { ...DEMO_USERS[role], email: email || DEMO_USERS[role].email };
    const token = btoa(`${user.id}.${role}.${Date.now()}`);
    return { user, token };
  },
  async logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      await new Promise((r) => setTimeout(r, 150));
    }
  },
};
