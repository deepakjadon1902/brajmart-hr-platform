import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAppDispatch, useAppSelector } from "@/store";
import type { Role } from "@/types";
import { Toaster } from "@/components/ui/sonner";
import { fetchEmployees, upsertCurrentEmployee } from "@/store/slices/workspaceSlice";
import { canAccessPortal } from "@/utils/portalAccess";

export function PortalLayout({ role }: { role: Role }) {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
  const user = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    if (!user) return;
    dispatch(
      upsertCurrentEmployee({
        ...user,
        status: "active",
      }),
    );
    if (canAccessPortal(user, "team-manager") || canAccessPortal(user, "hr")) {
      dispatch(fetchEmployees());
    }
  }, [dispatch, user]);

  return (
    <div className="flex min-h-dvh w-full bg-background">
      <Sidebar role={role} collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 bg-[linear-gradient(180deg,#ffffff_0%,#f7f8fb_46%,#ffffff_100%)] p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
        <Toaster position="top-right" richColors />
      </div>
    </div>
  );
}
