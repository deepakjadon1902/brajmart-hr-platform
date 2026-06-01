import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { leaves } from "@/services/mock";
import { StatusBadge } from "@/components/common/StatusBadge";
import { toast } from "sonner";

export default function Leaves() {
  return (
    <div className="space-y-6">
      <PageHeader title="Leave Approvals" subtitle="Review pending leave requests." />
      <DataTable data={leaves}
        searchKeys={["employeeName","type","status"]}
        columns={[
          { key: "employeeName", header: "Employee" },
          { key: "type", header: "Type", render: (r) => <span className="capitalize">{r.type}</span> },
          { key: "from", header: "From" },
          { key: "to", header: "To" },
          { key: "reason", header: "Reason" },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "id", header: "Actions", render: (r) => r.status === "pending" ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => toast.success(`Approved ${r.employeeName}`)}><Check className="mr-1 h-3 w-3" />Approve</Button>
              <Button size="sm" variant="outline" onClick={() => toast.error(`Rejected ${r.employeeName}`)}><X className="mr-1 h-3 w-3" />Reject</Button>
            </div>
          ) : <span className="text-xs text-muted-foreground">—</span> },
        ]}
      />
    </div>
  );
}
