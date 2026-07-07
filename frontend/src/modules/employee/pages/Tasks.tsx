import { TaskWorkspace } from "@/modules/tasks/TaskWorkspace";

export default function Tasks() {
  return (
    <TaskWorkspace
      title="My Tasks"
      subtitle="Track work assigned by HR, managers, and super admins."
      employeeOnly
    />
  );
}
