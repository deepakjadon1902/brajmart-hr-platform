import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store";
import { ROLE_META } from "@/constants/nav";
import type { Role } from "@/types";

export function ProtectedRoute({
  allow,
  children,
}: {
  allow: Role | Role[];
  children: React.ReactNode;
}) {
  const { user, token } = useAppSelector((s) => s.auth);
  const location = useLocation();
  const allowedRoles = Array.isArray(allow) ? allow : [allow];
  const primaryRole = allowedRoles[0];

  if (!user || !token) {
    return <Navigate to={ROLE_META[primaryRole].loginPath} state={{ from: location }} replace />;
  }
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_META[user.role].home} replace />;
  }
  return <>{children}</>;
}
