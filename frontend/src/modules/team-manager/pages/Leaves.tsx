import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store";
import { updateLeaveStatus } from "@/store/slices/workspaceSlice";
export default function P() {
  const dispatch = useAppDispatch();
  const leaves = useAppSelector((s) => s.workspace.leaves);

  return (
    <div className="space-y-6">
      <PageHeader title="Team Leaves" subtitle="Approve leaves for your team members." />
      <DataTable
        data={leaves}
        searchKeys={["employeeName", "type"]}
        columns={[
          { key: "employeeName", header: "Member" },
          { key: "type", header: "Type" },
          { key: "from", header: "From" },
          { key: "to", header: "To" },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          {
            key: "id",
            header: "",
            render: (r) =>
              r.status === "pending" ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      dispatch(updateLeaveStatus({ id: r.id, status: "approved" }));
                      toast.success("Approved");
                    }}
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      dispatch(updateLeaveStatus({ id: r.id, status: "rejected" }));
                      toast.error("Rejected");
                    }}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Reject
                  </Button>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              ),
          },
        ]}
      />
    </div>
  );
}
