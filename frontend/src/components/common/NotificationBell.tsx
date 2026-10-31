import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchNotifications, markNotificationRead } from "@/store/slices/workspaceSlice";
import { formatNotificationTime } from "@/utils/taskDeadline";
import { canAccessPortal } from "@/utils/portalAccess";

export function NotificationBell() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const { notifications, notificationsError } = useAppSelector((state) => state.workspace);
  const own = notifications.filter((item) => item.employeeId === user?.id);
  const unread = own.filter((item) => !item.read).length;
  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) void dispatch(fetchNotifications());
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-[70dvh] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto"
      >
        <DropdownMenuLabel>Notifications {unread > 0 && `(${unread} unread)`}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notificationsError && (
          <p className="px-2 py-2 text-xs text-destructive" role="alert">
            Could not refresh notifications. Reopen this menu to retry.
          </p>
        )}
        {!own.length && (
          <p className="px-2 py-4 text-sm text-muted-foreground">No notifications yet.</p>
        )}
        {own.slice(0, 5).map((item) => (
          <DropdownMenuItem
            key={item.id}
            className="flex cursor-pointer items-start gap-2 p-3"
            onSelect={async () => {
              try {
                if (!item.read) await dispatch(markNotificationRead(item.id)).unwrap();
                if (item.taskId) navigate(`/employee/tasks?task=${item.taskId}`);
              } catch {
                toast.error("Unable to mark notification as read");
              }
            }}
          >
            {!item.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
              <p className="text-[11px] text-muted-foreground">
                {formatNotificationTime(item.time)}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
        {canAccessPortal(user, "employee") && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer justify-center text-primary"
              onSelect={() => navigate("/employee/notifications")}
            >
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
