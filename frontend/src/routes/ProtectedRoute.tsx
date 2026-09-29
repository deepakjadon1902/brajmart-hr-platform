import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store";
import { ROLE_META } from "@/constants/nav";
import type { Role } from "@/types";
import { canAccessAnyPortal, defaultHomeFor } from "@/utils/portalAccess";

export function ProtectedRoute({
  allow,
  children,
}: {
  allow: Role | Role[];
  children: React.ReactNode;
}) {
  const { user, token, status, sessionChecked } = useAppSelector((s) => s.auth);
  const location = useLocation();
  const allowedRoles = Array.isArray(allow) ? allow : [allow];
  const primaryRole = allowedRoles[0];

  if (!sessionChecked || status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
        Restoring session...
      </div>
    );
  }

  if (!user || !token) {
    return <Navigate to={ROLE_META[primaryRole].loginPath} state={{ from: location }} replace />;
  }
  if (!canAccessAnyPortal(user, allowedRoles)) {
    return <Navigate to={defaultHomeFor(user)} replace />;
  }
  return <>{children}</>;
}
