import { TaskWorkspace } from "@/modules/tasks/TaskWorkspace";

export default function P() {
  return (
    <TaskWorkspace title="Tasks" subtitle="Plan and track your team's work." canAssign />
  );
}
