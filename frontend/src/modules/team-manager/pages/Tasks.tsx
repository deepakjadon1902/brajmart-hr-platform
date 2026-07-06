import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

const columns = ["To Do", "In Progress", "Done"];

export default function P() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tasks" subtitle="Plan and track your team's work." />
      <div className="grid gap-4 md:grid-cols-3">
        {columns.map((title) => (
          <Card key={title} className="p-4 shadow-soft">
            <h3 className="mb-3 font-semibold">{title}</h3>
            <EmptyState
              icon={<ClipboardList className="h-5 w-5" />}
              title="No tasks"
              description="Tasks will appear here after they are created in the database."
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
