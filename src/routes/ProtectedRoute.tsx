import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store";
import { ROLE_META } from "@/constants/nav";
import type { Role } from "@/types";

export function ProtectedRoute({ allow, children }: { allow: Role; children: React.ReactNode }) {
  const { user, token } = useAppSelector((s) => s.auth);
  const location = useLocation();

  if (!user || !token) {
    return <Navigate to={ROLE_META[allow].loginPath} state={{ from: location }} replace />;
  }
  if (user.role !== allow) {
    // Logged in as the wrong role — push them to their own home.
    return <Navigate to={ROLE_META[user.role].home} replace />;
  }
  return <>{children}</>;
}
