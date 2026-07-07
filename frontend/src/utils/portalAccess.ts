import type { Role, User } from "@/types";
import { ROLE_META } from "@/constants/nav";

export function isManagerDesignation(user?: Pick<User, "designation"> | null) {
  return /\bmanager\b/i.test(user?.designation || "");
}

export function canAccessPortal(user: User | null | undefined, portalRole: Role) {
  if (!user) return false;
  if (user.role === portalRole) return true;
  if (user.role === "super-admin") return true;

  const accessByPortal: Record<Role, Role[]> = {
    employee: ["employee", "team-manager", "hr", "super-admin"],
    hr: ["hr", "super-admin"],
    "team-manager": ["team-manager", "hr", "super-admin"],
    "super-admin": ["super-admin"],
    "digital-marketing": ["digital-marketing", "hr", "super-admin"],
  };

  if (accessByPortal[portalRole].includes(user.role)) return true;
  if (portalRole === "team-manager" && user.role === "employee" && isManagerDesignation(user)) {
    return true;
  }
  return false;
}

export function canAccessAnyPortal(user: User | null | undefined, roles: Role[]) {
  return roles.some((role) => canAccessPortal(user, role));
}

export function defaultHomeFor(user: User) {
  if (user.role === "employee" && isManagerDesignation(user)) return ROLE_META["team-manager"].home;
  return ROLE_META[user.role].home;
}
