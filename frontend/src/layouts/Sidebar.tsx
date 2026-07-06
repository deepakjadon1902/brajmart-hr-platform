import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { NAV, ROLE_META } from "@/constants/nav";
import { useAppSelector } from "@/store";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";
import { BrandLogo } from "@/components/common/BrandLogo";

export function Sidebar({ role, collapsed }: { role: Role; collapsed: boolean }) {
  const items = NAV[role];
  const branding = useAppSelector((s) => s.theme.branding);
  const meta = ROLE_META[role];

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 border-r border-black/5 bg-white text-sidebar-foreground shadow-[8px_0_30px_rgba(15,23,42,0.03)] transition-[width] md:flex md:flex-col",
        collapsed ? "w-[76px]" : "w-64",
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-black/5 px-4">
        <BrandLogo compact className="h-10 w-10 rounded-full p-1" />
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{branding.companyName}</div>
            <div className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
              {meta.title}
            </div>
          </div>
        )}
      </div>

      <nav className="scrollbar-thin flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId={`active-${role}`}
                        className="absolute left-0 h-6 w-1 rounded-r-full bg-primary"
                      />
                    )}
                    <item.icon className="h-4.5 w-4.5 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {!collapsed && (
        <div className="border-t p-3">
          <div className="rounded-xl border border-black/5 bg-muted/70 p-3 text-xs">
            <p className="font-semibold">Need help?</p>
            <p className="mt-1 text-muted-foreground">Reach out to support 24/7.</p>
          </div>
        </div>
      )}
    </aside>
  );
}
