import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ClipboardList, Loader2, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/store";
import { addTask, fetchEmployees, fetchTasks, updateTask } from "@/store/slices/workspaceSlice";
import type { Task, TaskStatus } from "@/types";
import { canAccessPortal } from "@/utils/portalAccess";
import { formatTaskDeadline, getTaskDeadline } from "@/utils/taskDeadline";
import { useManagedTeams } from "@/modules/teams/useManagedTeams";
import { TeamFilter } from "@/modules/teams/TeamFilter";

const taskStatuses: TaskStatus[] = ["not-started", "in-progress", "completed"];
const statusLabels: Record<TaskStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  completed: "Completed",
};

function errorMessage(error: unknown, fallback: string) {
  return typeof error === "object" && error && "message" in error
    ? String(error.message)
    : fallback;
}

function TaskStatusControls({ task }: { task: Task }) {
  const dispatch = useAppDispatch();
  const [saving, setSaving] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Select
        value={task.status}
        disabled={saving}
        onValueChange={async (value) => {
          const status = value as TaskStatus;
          if (status === task.status || saving) return;
          setSaving(true);
          try {
            await dispatch(updateTask({ id: task.id, status })).unwrap();
            toast.success("Task status updated");
          } catch (error) {
            toast.error(errorMessage(error, "Unable to update task"));
          } finally {
            setSaving(false);
          }
        }}
      >
        <SelectTrigger className="w-40" aria-label={`Update status for ${task.title}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {taskStatuses.map((status) => (
            <SelectItem key={status} value={status}>
              {statusLabels[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {saving && <Loader2 className="h-4 w-4 animate-spin" aria-label="Saving status" />}
    </div>
  );
}

export function TaskWorkspace({
  title,
  subtitle,
  canAssign = false,
  employeeOnly = false,
  teamOnly = false,
}: {
  title: string;
  subtitle: string;
  canAssign?: boolean;
  employeeOnly?: boolean;
  teamOnly?: boolean;
}) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTaskId = searchParams.get("task");
  const selectedTeamId = searchParams.get("team") || "all";
  const managed = useManagedTeams(selectedTeamId);
  const activeCompanyId = useAppSelector((s) => s.company.activeId);
  const companyId = user?.role === "super-admin" ? activeCompanyId : user?.companyId;
  const { employees, tasks } = useAppSelector((s) => s.workspace);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState("");
  const refreshInFlight = useRef(false);
  const assignableEmployees = useMemo(
    () =>
      employees
        .filter(
          (employee) =>
            employee.companyId === companyId &&
            employee.status !== "inactive" &&
            canAccessPortal(employee, "employee"),
        )
        .filter((employee) => !teamOnly || managed.memberIds.has(employee.id)),
    [companyId, employees, managed.memberIds, teamOnly],
  );
  const visibleTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.companyId === companyId &&
          (!employeeOnly || task.employeeId === user?.id) &&
          (!teamOnly || managed.memberIds.has(task.employeeId)),
      ),
    [companyId, employeeOnly, managed.memberIds, tasks, teamOnly, user?.id],
  );
  const openTasks = visibleTasks.filter((task) => task.status !== "completed").length;

  const refreshTasks = useCallback(async () => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    setRefreshing(true);
    try {
      await dispatch(fetchTasks()).unwrap();
      setLoadError("");
    } catch (error) {
      setLoadError(errorMessage(error, "Unable to load tasks"));
    } finally {
      refreshInFlight.current = false;
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    void refreshTasks();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshTasks();
    };
    const timer = window.setInterval(refreshWhenVisible, 5000);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [companyId, refreshTasks, user?.id]);

  const loadEmployees = useCallback(async () => {
    setEmployeesLoading(true);
    setEmployeesError("");
    try {
      await dispatch(fetchEmployees()).unwrap();
    } catch (error) {
      setEmployeesError(errorMessage(error, "Unable to load employees"));
    } finally {
      setEmployeesLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (dialogOpen) void loadEmployees();
  }, [companyId, dialogOpen, loadEmployees]);

  const onAssign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const titleValue = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const dueDate = String(form.get("dueDate") ?? "").trim();
    const dueTime = dueDate ? String(form.get("dueTime") || "23:59") : "";

    if (!assignableEmployees.some((employee) => employee.id === employeeId)) {
      setFormError("Select an active employee to assign this task.");
      return;
    }
    if (!titleValue) {
      setFormError("Task title is required.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await dispatch(
        addTask({ employeeId, title: titleValue, description, priority, dueDate, dueTime }),
      ).unwrap();
      formElement.reset();
      setEmployeeId("");
      setPriority("medium");
      setDialogOpen(false);
      toast.success("Task saved and assigned to the employee");
    } catch (error) {
      const message = errorMessage(error, "Unable to assign task");
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          canAssign ? (
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                if (saving) return;
                setDialogOpen(open);
                setFormError("");
                if (!open) {
                  setEmployeeId("");
                  setPriority("medium");
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Assign task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90dvh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Assign task</DialogTitle>
                  <DialogDescription>
                    The task will appear in the selected employee&apos;s task page.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={onAssign}>
                  <div>
                    <Label htmlFor="task-employee">Employee</Label>
                    <Select
                      name="employeeId"
                      value={employeeId}
                      onValueChange={setEmployeeId}
                      required
                      disabled={saving || employeesLoading || !!employeesError}
                    >
                      <SelectTrigger id="task-employee" className="mt-1">
                        <SelectValue
                          placeholder={
                            employeesLoading ? "Loading employees..." : "Select employee"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableEmployees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name} - {employee.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {employeesError ? (
                      <div className="mt-2 text-sm text-destructive" role="alert">
                        {employeesError}
                        <Button type="button" variant="link" onClick={() => void loadEmployees()}>
                          Retry
                        </Button>
                      </div>
                    ) : !employeesLoading && !assignableEmployees.length ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {teamOnly
                          ? "Add active employees to your team before assigning a task."
                          : "Add an active employee before assigning a task."}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <Label htmlFor="task-title">Title</Label>
                    <Input
                      id="task-title"
                      name="title"
                      className="mt-1"
                      maxLength={180}
                      required
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <Label htmlFor="task-description">Description</Label>
                    <Textarea
                      id="task-description"
                      name="description"
                      className="mt-1"
                      maxLength={2000}
                      rows={3}
                      disabled={saving}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <Label htmlFor="task-priority">Priority</Label>
                      <Select
                        name="priority"
                        value={priority}
                        onValueChange={(value) => setPriority(value as Task["priority"])}
                        disabled={saving}
                      >
                        <SelectTrigger id="task-priority" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="task-due">Due date</Label>
                      <Input
                        id="task-due"
                        name="dueDate"
                        type="date"
                        className="mt-1"
                        disabled={saving}
                      />
                    </div>
                    <div>
                      <Label htmlFor="task-due-time">Due time (IST)</Label>
                      <Input
                        id="task-due-time"
                        name="dueTime"
                        type="time"
                        defaultValue="17:00"
                        className="mt-1"
                        disabled={saving}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Set a due date and time for reminders. All deadlines use IST. If the time is
                    blank, the deadline is 11:59 PM.
                  </p>
                  {formError && (
                    <p className="text-sm text-destructive" role="alert">
                      {formError}
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      saving || employeesLoading || !!employeesError || !assignableEmployees.length
                    }
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {saving ? "Saving task..." : "Save task"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      {teamOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TeamFilter
            teams={managed.teams}
            value={selectedTeamId}
            onChange={(id) => {
              const next = new URLSearchParams(searchParams);
              next.delete("task");
              if (id === "all") next.delete("team");
              else next.set("team", id);
              setSearchParams(next);
            }}
          />
          <Button variant="outline" asChild>
            <Link to="/team-manager/teams">Manage teams</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 shadow-soft">
          <p className="text-sm text-muted-foreground">Open</p>
          <p className="mt-1 text-2xl font-semibold">{openTasks}</p>
        </Card>
        <Card className="p-4 shadow-soft">
          <p className="text-sm text-muted-foreground">In progress</p>
          <p className="mt-1 text-2xl font-semibold">
            {visibleTasks.filter((task) => task.status === "in-progress").length}
          </p>
        </Card>
        <Card className="p-4 shadow-soft">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="mt-1 text-2xl font-semibold">
            {visibleTasks.filter((task) => task.status === "completed").length}
          </p>
        </Card>
      </div>

      {loadError && (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          Could not refresh tasks: {loadError}. Use Refresh to try again.
        </p>
      )}

      {selectedTaskId && (
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 text-sm">
          <p>Showing the task from your notification.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete("task");
              setSearchParams(next);
            }}
          >
            Show all tasks
          </Button>
        </div>
      )}

      <DataTable
        key={`${companyId}:${selectedTaskId || "all"}:${selectedTeamId}`}
        data={
          selectedTaskId ? visibleTasks.filter((task) => task.id === selectedTaskId) : visibleTasks
        }
        searchKeys={[
          "title",
          "description",
          "employeeName",
          "status",
          "priority",
          "assignedByName",
        ]}
        emptyMessage={
          refreshing
            ? "Loading tasks..."
            : loadError
              ? "Tasks are unavailable. Please try refreshing."
              : selectedTaskId
                ? "This task is no longer available in your task list."
                : "No tasks assigned yet"
        }
        toolbar={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={refreshing}
            onClick={() => void refreshTasks()}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
        columns={[
          {
            key: "title",
            header: "Task",
            render: (task) => (
              <div className="min-w-56">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  <p className="break-words font-medium">{task.title}</p>
                </div>
                {task.description && (
                  <p className="mt-1 whitespace-pre-wrap break-words text-xs text-muted-foreground">
                    {task.description}
                  </p>
                )}
              </div>
            ),
          },
          { key: "employeeName", header: "Employee" },
          {
            key: "priority",
            header: "Priority",
            render: (task) => <StatusBadge status={task.priority} />,
          },
          {
            key: "dueDate",
            header: "Deadline (IST)",
            render: (task) => {
              const deadline = getTaskDeadline(task);
              const overdue =
                deadline && deadline.getTime() <= Date.now() && task.status !== "completed";
              return (
                <span className={overdue ? "text-destructive" : undefined}>
                  {formatTaskDeadline(task)}
                </span>
              );
            },
          },
          {
            key: "status",
            header: "Status",
            render: (task) => <StatusBadge status={task.status} />,
          },
          { key: "assignedByName", header: "Assigned by" },
          { key: "id", header: "Update", render: (task) => <TaskStatusControls task={task} /> },
        ]}
      />
    </div>
  );
}
