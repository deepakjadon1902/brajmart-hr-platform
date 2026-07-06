import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function Analytics() {
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Trends across headcount, attrition and engagement." />
      <Card className="p-6 shadow-soft">
        <EmptyState
          icon={<BarChart3 className="h-6 w-6" />}
          title="No analytics records"
          description="Analytics will appear after time-series HR records are saved in the database."
        />
      </Card>
    </div>
  );
}
