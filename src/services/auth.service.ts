import type { Role, User } from "@/types";

// Demo credentials accepted by the mocked login service.
// Real implementations should swap this for an API call.
const DEMO_USERS: Record<Role, User> = {
  employee:      { id: "u1", name: "Aarav Sharma",  email: "employee@demo.com",   role: "employee",     companyId: "c1", department: "Engineering", designation: "Engineer II" },
  hr:            { id: "u2", name: "Priya Verma",   email: "hr@demo.com",         role: "hr",           companyId: "c1", department: "People",      designation: "HR Partner" },
  "team-manager":{ id: "u3", name: "Vikram Singh",  email: "manager@demo.com",    role: "team-manager", companyId: "c1", department: "Engineering", designation: "Engineering Manager" },
  "super-admin": { id: "u4", name: "Megha Kapoor",  email: "admin@demo.com",      role: "super-admin",  companyId: "c1", department: "Executive",   designation: "Platform Admin" },
};

export const authService = {
  async login(role: Role, email: string, _password: string): Promise<{ user: User; token: string }> {
    await new Promise((r) => setTimeout(r, 600));
    const user = { ...DEMO_USERS[role], email: email || DEMO_USERS[role].email };
    const token = btoa(`${user.id}.${role}.${Date.now()}`);
    return { user, token };
  },
  async logout() { await new Promise((r) => setTimeout(r, 150)); },
};
