import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Award } from "lucide-react";

export default function Performance() {
  return (
    <div className="space-y-6">
      <PageHeader title="Performance" subtitle="Track reviews and ratings across teams." />
      <EmptyState
        icon={<Award className="h-6 w-6" />}
        title="No performance reviews"
        description="Performance records will appear here after HR or managers save them in the database."
      />
    </div>
  );
}
