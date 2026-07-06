import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Megaphone } from "lucide-react";

export default function Announcements() {
  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" subtitle="Broadcasts visible to all employees." />
      <EmptyState
        icon={<Megaphone className="h-6 w-6" />}
        title="No announcements"
        description="Announcements will appear here after HR publishes them from the database."
      />
    </div>
  );
}
