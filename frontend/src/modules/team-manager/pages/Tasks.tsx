import { TaskWorkspace } from "@/modules/tasks/TaskWorkspace";

export default function P() {
  return (
    <TaskWorkspace
      title="Team Tasks"
      subtitle="Assign work to your team members and track their progress."
      canAssign
      teamOnly
    />
  );
}
