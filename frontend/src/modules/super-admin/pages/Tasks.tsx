import { TaskWorkspace } from "@/modules/tasks/TaskWorkspace";

export default function Tasks() {
  return (
    <TaskWorkspace
      title="Platform Tasks"
      subtitle="Assign work across employees and track completion."
      canAssign
    />
  );
}
