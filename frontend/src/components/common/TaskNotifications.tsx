import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchNotifications, markNotificationRead } from "@/store/slices/workspaceSlice";

export function TaskNotifications() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const token = useAppSelector((state) => state.auth.token);

  useEffect(() => {
    if (!userId || !token) return;
    let stopped = false;
    let pending = false;
    const seenKey = `task_notification_popups_v1:${userId}`;
    let seen = new Set<string>();
    try {
      seen = new Set(JSON.parse(sessionStorage.getItem(seenKey) || "[]") as string[]);
    } catch {
      /* Use memory when browser storage is unavailable. */
    }
    const showing = new Set<string>();
    const markRead = (id: string) => {
      void dispatch(markNotificationRead(id))
        .unwrap()
        .catch(() => {
          toast.error("Unable to mark the notification as read. You can retry in Notifications.");
        });
    };
    const poll = async () => {
      if (pending || document.visibilityState !== "visible") return;
      pending = true;
      try {
        const notifications = await dispatch(fetchNotifications()).unwrap();
        if (stopped) return;
        const unread = notifications.filter(
          (item) => item.employeeId === userId && item.taskId && item.event && !item.read,
        );
        for (const id of showing) {
          if (!unread.some((item) => item.id === id)) {
            toast.dismiss(id);
            showing.delete(id);
          }
        }
        const fresh = unread.filter((item) => !seen.has(item.id));
        for (const notification of fresh) seen.add(notification.id);
        try {
          sessionStorage.setItem(seenKey, JSON.stringify([...seen].slice(-2000)));
        } catch {
          /* Keep deduplication in memory. */
        }
        for (const notification of fresh.slice(0, 3)) {
          showing.add(notification.id);
          const show =
            notification.event === "task-assigned"
              ? toast.info
              : notification.event === "task-overdue"
                ? toast.error
                : toast.warning;
          show(notification.title, {
            id: notification.id,
            description: notification.body,
            duration: 12000,
            closeButton: true,
            action: {
              label: "View task",
              onClick: () => {
                markRead(notification.id);
                navigate(`/employee/tasks?task=${notification.taskId}`);
              },
            },
            onDismiss: () => markRead(notification.id),
          });
        }
      } catch {
        /* The notification menu displays refresh errors and retains the saved inbox. */
      } finally {
        pending = false;
      }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 5000);
    const onFocus = () => void poll();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      for (const id of showing) toast.dismiss(id);
    };
  }, [dispatch, navigate, token, userId]);

  return null;
}
