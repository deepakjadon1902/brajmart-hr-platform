import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchNotifications, markNotificationRead } from "@/store/slices/workspaceSlice";
import { formatNotificationTime } from "@/utils/taskDeadline";

export default function Notifications() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const userId = useAppSelector((s) => s.auth.user?.id);
  const { notifications: allNotifications, notificationsError } = useAppSelector(
    (s) => s.workspace,
  );
  const notifications = allNotifications.filter((item) => item.employeeId === userId);
  const [savingId, setSavingId] = useState<string | null>(null);
  const markRead = async (id: string) => {
    setSavingId(id);
    try {
      await dispatch(markNotificationRead(id)).unwrap();
      return true;
    } catch {
      toast.error("Unable to mark notification as read");
      return false;
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Task assignments, deadline reminders, and other updates."
        actions={
          <Button variant="outline" onClick={() => void dispatch(fetchNotifications())}>
            Refresh notifications
          </Button>
        }
      />
      {notificationsError && (
        <p className="text-sm text-destructive" role="alert">
          Unable to refresh notifications. Please try again.
        </p>
      )}
      {!notifications.length && (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No notifications yet. Task assignments and deadline reminders will appear here.
        </Card>
      )}
      <div className="space-y-3">
        {notifications.map((n) => (
          <Card
            key={n.id}
            className={`flex items-start gap-4 p-4 shadow-soft ${!n.read ? "border-primary/30" : ""}`}
          >
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium">{n.title}</p>
                <span className="text-xs text-muted-foreground">
                  {formatNotificationTime(n.time)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{n.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {n.taskId && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={savingId === n.id}
                    onClick={async () => {
                      if (n.read || (await markRead(n.id)))
                        navigate(`/employee/tasks?task=${n.taskId}`);
                    }}
                  >
                    View task
                  </Button>
                )}
                {!n.read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={savingId === n.id}
                    onClick={() => void markRead(n.id)}
                  >
                    {savingId === n.id ? "Saving..." : "Mark as read"}
                  </Button>
                )}
              </div>
            </div>
            {!n.read && <span className="mt-1 h-2 w-2 rounded-full bg-primary" />}
          </Card>
        ))}
      </div>
    </div>
  );
}
