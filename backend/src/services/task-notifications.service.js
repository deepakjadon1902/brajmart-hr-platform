import { createHash } from "node:crypto";
import { Notification, Task } from "../models/PortalData.js";
import { AppError } from "../utils/AppError.js";

const hour = 60 * 60 * 1000;
const reminderEvents = ["task-due-day", "task-due-hour", "task-overdue"];

export function taskDeadline(task) {
  if (!task.dueDate) return null;
  const deadline = new Date(
    `${task.dueDate}T${task.dueTime || "23:59"}:00+05:30`,
  );
  return Number.isNaN(deadline.getTime()) ? null : deadline;
}

export function taskDeadlineFields(task) {
  if (task.dueTime && !task.dueDate)
    throw new AppError("Choose a due date before setting a due time", 400);
  return {
    dueDate: task.dueDate || "",
    dueTime: task.dueDate ? task.dueTime || "23:59" : "",
    dueAt: taskDeadline(task),
  };
}

export function formatTaskDeadline(task) {
  const deadline = taskDeadline(task);
  if (!deadline) return "";
  return `${new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(deadline)} IST`;
}

async function saveNotification(
  task,
  event,
  title,
  body,
  now,
  deadline = null,
) {
  const key = `${task._id}:${task.employeeId}:${task.assignmentVersion || 1}:${event}:${deadline?.toISOString() || ""}`;
  const id = createHash("sha256").update(key).digest("hex").slice(0, 24);
  try {
    return await Notification.findOneAndUpdate(
      { _id: id },
      {
        $setOnInsert: {
          companyId: task.companyId,
          employeeId: task.employeeId,
          taskId: task._id,
          event,
          deadlineAt: deadline,
          title,
          body,
          time: now.toISOString(),
          read: false,
          type:
            event === "task-assigned"
              ? "info"
              : event === "task-overdue"
                ? "danger"
                : "warning",
        },
      },
      { upsert: true, new: true, runValidators: true },
    );
  } catch (error) {
    // Concurrent workers can generate the same event. The built-in unique _id keeps one copy.
    if (error.code !== 11000) throw error;
    return Notification.findById(id);
  }
}

export async function syncTaskNotifications(task, now = new Date()) {
  if (!task.assignmentNotified) {
    const deadline = formatTaskDeadline(task);
    await saveNotification(
      task,
      "task-assigned",
      "New task assigned",
      `${task.assignedByName} assigned you "${task.title}".${deadline ? ` Complete it by ${deadline}.` : ""}`,
      now,
    );
    await Task.updateOne(
      { _id: task._id, employeeId: task.employeeId },
      { $set: { assignmentNotified: true } },
    );
  }
  if (task.status === "completed") return;
  const deadline = taskDeadline(task);
  if (!deadline) return;
  const remaining = deadline.getTime() - now.getTime();
  const event =
    remaining <= 0
      ? "task-overdue"
      : remaining <= hour
        ? "task-due-hour"
        : remaining <= 24 * hour
          ? "task-due-day"
          : null;
  if (!event) return;
  const reminderKey = `${task.employeeId}:${deadline.toISOString()}:${event}`;
  if (task.lastReminderKey === reminderKey) return;
  const title =
    event === "task-overdue"
      ? "Task deadline reached"
      : event === "task-due-hour"
        ? "Task due within one hour"
        : "Task due within 24 hours";
  await saveNotification(
    task,
    event,
    title,
    `"${task.title}" is due by ${formatTaskDeadline(task)}. ${event === "task-overdue" ? "Please complete the task or update HR on your progress." : "Please complete the task before the deadline."}`,
    now,
    deadline,
  );
  await Task.updateOne(
    { _id: task._id, employeeId: task.employeeId },
    { $set: { lastReminderKey: reminderKey } },
  );
}

export async function syncPendingTaskNotifications(
  scope = {},
  now = new Date(),
) {
  const tomorrow = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now.getTime() + 24 * hour));
  const tasks = await Task.find({
    ...scope,
    $or: [
      { assignmentNotified: { $ne: true } },
      {
        status: { $ne: "completed" },
        dueDate: { $exists: true, $ne: "", $lte: tomorrow },
      },
    ],
  }).lean();
  // Limit concurrent database work when a large number of reminders become due together.
  for (let index = 0; index < tasks.length; index += 10) {
    await Promise.all(
      tasks
        .slice(index, index + 10)
        .map((task) => syncTaskNotifications(task, now)),
    );
  }
}

export async function updateTaskNotifications(task, previous) {
  if (previous && String(previous.employeeId) !== String(task.employeeId)) {
    await Notification.deleteMany({ taskId: task._id });
  } else if (
    previous &&
    String(previous.dueAt || taskDeadline(previous)) !==
      String(task.dueAt || taskDeadline(task))
  ) {
    await Notification.deleteMany({
      taskId: task._id,
      event: { $in: reminderEvents },
    });
  }
  if (task.status === "completed") {
    await Notification.updateMany(
      { taskId: task._id, event: { $in: reminderEvents }, read: false },
      { $set: { read: true } },
    );
  }
  await syncTaskNotifications(task);
}

export function startTaskReminderScheduler() {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await syncPendingTaskNotifications();
    } catch (error) {
      console.error("Unable to generate task notifications:", error.message);
    } finally {
      running = false;
    }
  };
  void run();
  const timer = setInterval(() => void run(), 60000);
  timer.unref();
  return () => clearInterval(timer);
}
