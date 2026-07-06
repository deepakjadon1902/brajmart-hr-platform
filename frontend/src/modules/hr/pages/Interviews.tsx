import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Video } from "lucide-react";

export default function Interviews() {
  return (
    <div className="space-y-6">
      <PageHeader title="Interview Management" subtitle="Upcoming interviews and panels." />
      <EmptyState
        icon={<Video className="h-6 w-6" />}
        title="No interviews scheduled"
        description="Interview records will appear here after HR creates them in the database."
      />
    </div>
  );
}
