import { FormEvent, useEffect, useMemo } from "react";
import { ClipboardList, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { addTask, fetchWorkspace, updateTask } from "@/store/slices/workspaceSlice";
import type { Task, TaskStatus } from "@/types";

const taskStatuses: TaskStatus[] = ["not-started", "in-progress", "completed"];

function TaskStatusControls({ task }: { task: Task }) {
  const dispatch = useAppDispatch();

  return (
    <div className="flex flex-wrap gap-2">
      {taskStatuses.map((status) => (
        <Button
          key={status}
          type="button"
          size="sm"
          variant={task.status === status ? "default" : "outline"}
          onClick={async () => {
            try {
              await dispatch(updateTask({ id: task.id, status })).unwrap();
              toast.success("Task status updated");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Unable to update task");
            }
          }}
        >
          {status.replace("-", " ")}
        </Button>
      ))}
    </div>
  );
}

export function TaskWorkspace({
  title,
  subtitle,
  canAssign = false,
  employeeOnly = false,
}: {
  title: string;
  subtitle: string;
  canAssign?: boolean;
  employeeOnly?: boolean;
}) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { employees, tasks } = useAppSelector((s) => s.workspace);
  const assignableEmployees = useMemo(
    () => employees.filter((employee) => employee.status !== "inactive"),
    [employees],
  );
  const visibleTasks = useMemo(
    () => (employeeOnly ? tasks.filter((task) => task.employeeId === user?.id) : tasks),
    [employeeOnly, tasks, user?.id],
  );
  const openTasks = visibleTasks.filter((task) => task.status !== "completed").length;

  useEffect(() => {
    const timer = window.setInterval(() => {
      dispatch(fetchWorkspace());
    }, 30000);
    return () => window.clearInterval(timer);
  }, [dispatch]);

  const onAssign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const employeeId = String(form.get("employeeId") ?? "");
    const titleValue = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const priority = String(form.get("priority") ?? "medium") as Task["priority"];
    const dueDate = String(form.get("dueDate") ?? "").trim();

    try {
      await dispatch(
        addTask({ employeeId, title: titleValue, description, priority, dueDate }),
      ).unwrap();
      toast.success("Task assigned");
      event.currentTarget.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to assign task");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          canAssign ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Assign task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign task</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={onAssign}>
                  <div>
                    <Label>Employee</Label>
                    <Select name="employeeId" required>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableEmployees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name} - {employee.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="task-title">Title</Label>
                    <Input id="task-title" name="title" className="mt-1" required />
                  </div>
                  <div>
                    <Label htmlFor="task-description">Description</Label>
                    <Input id="task-description" name="description" className="mt-1" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Priority</Label>
                      <Select name="priority" defaultValue="medium">
                        <SelectTrigger className="mt-1">
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
                      <Input id="task-due" name="dueDate" type="date" className="mt-1" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    Save task
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

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

      <DataTable
        data={visibleTasks}
        searchKeys={["title", "employeeName", "status", "priority"]}
        emptyMessage="No tasks assigned yet"
        columns={[
          {
            key: "title",
            header: "Task",
            render: (task) => (
              <div className="min-w-56">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  <p className="font-medium">{task.title}</p>
                </div>
                {task.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{task.description}</p>
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
          { key: "dueDate", header: "Due" },
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
