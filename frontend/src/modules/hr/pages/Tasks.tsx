import { TaskWorkspace } from "@/modules/tasks/TaskWorkspace";

export default function Tasks() {
  return (
    <TaskWorkspace
      title="Task Assignment"
      subtitle="Assign work to employees and monitor live status updates."
      canAssign
    />
  );
}
