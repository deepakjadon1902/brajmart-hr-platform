import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

export default function Recruitment() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruitment"
        subtitle="Open positions and applicant funnel."
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Job
          </Button>
        }
      />
      <EmptyState
        icon={<Users className="h-6 w-6" />}
        title="No open jobs"
        description="Recruitment records will appear here after they are saved in the database."
      />
    </div>
  );
}
