import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAppSelector } from "@/store";
import type { Role } from "@/types";
import { Toaster } from "@/components/ui/sonner";

export function PortalLayout({ role }: { role: Role }) {
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
  return (
    <div className="flex min-h-dvh w-full bg-background">
      <Sidebar role={role} collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
        <Toaster position="top-right" richColors />
      </div>
    </div>
  );
}
