import type { Task } from "@/types";

const dateTimeFormat = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function getTaskDeadline(task: Pick<Task, "dueDate" | "dueTime" | "dueAt">) {
  if (!task.dueDate) return null;
  const date = new Date(task.dueAt || `${task.dueDate}T${task.dueTime || "23:59"}:00+05:30`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatTaskDeadline(task: Pick<Task, "dueDate" | "dueTime" | "dueAt">) {
  const date = getTaskDeadline(task);
  return date ? `${dateTimeFormat.format(date)} IST` : "No deadline";
}

export function formatNotificationTime(time: string) {
  const date = new Date(time);
  return time.includes("T") && !Number.isNaN(date.getTime())
    ? `${dateTimeFormat.format(date)} IST`
    : time;
}
