export function isManagerDesignation(user) {
  return /\bmanager\b/i.test(user?.designation || "");
}

export function canAccessPortal(user, portalRole) {
  if (!user) return false;
  if (user.role === portalRole) return true;
  if (user.role === "super-admin") return true;

  const accessByPortal = {
    employee: ["employee", "team-manager", "hr", "super-admin"],
    hr: ["hr", "super-admin"],
    "team-manager": ["team-manager", "hr", "super-admin"],
    "super-admin": ["super-admin"],
    "digital-marketing": ["digital-marketing", "hr", "super-admin"],
  };

  if (accessByPortal[portalRole]?.includes(user.role)) return true;
  if (portalRole === "team-manager" && user.role === "employee" && isManagerDesignation(user)) return true;
  return false;
}

export function canAccessAnyPortal(user, portalRoles) {
  return portalRoles.some((role) => canAccessPortal(user, role));
}
