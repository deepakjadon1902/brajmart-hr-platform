import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store";
import { updateLeaveStatus } from "@/store/slices/workspaceSlice";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TeamFilter } from "@/modules/teams/TeamFilter";
import { useManagedTeams } from "@/modules/teams/useManagedTeams";
import { useTeamActivityRefresh } from "@/modules/teams/useTeamActivityRefresh";
export default function P() {
  const dispatch = useAppDispatch();
  const allLeaves = useAppSelector((s) => s.workspace.leaves);
  const [params, setParams] = useSearchParams();
  const selected = params.get("team") || "all";
  const { teams, memberIds } = useManagedTeams(selected);
  const leaves = allLeaves.filter((leave) => memberIds.has(leave.employeeId || ""));
  const [savingId, setSavingId] = useState<string | null>(null);
  const { refresh, error } = useTeamActivityRefresh();
  const review = async (id: string, status: "approved" | "rejected") => {
    setSavingId(id);
    try {
      await dispatch(updateLeaveStatus({ id, status })).unwrap();
      toast.success(status === "approved" ? "Leave approved" : "Leave rejected");
    } catch (error) {
      toast.error((error as { message?: string }).message || "Unable to review leave");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Leaves"
        subtitle="Approve leaves for your team members."
        actions={
          <Button variant="outline" onClick={() => void refresh()}>
            Refresh leaves
          </Button>
        }
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <TeamFilter
        teams={teams}
        value={selected}
        onChange={(id) => setParams(id === "all" ? {} : { team: id })}
      />
      <DataTable
        key={selected}
        data={leaves}
        searchKeys={["employeeName", "type"]}
        columns={[
          { key: "employeeName", header: "Member" },
          { key: "type", header: "Type" },
          { key: "from", header: "From" },
          { key: "to", header: "To" },
          { key: "reason", header: "Reason" },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "reviewedByName", header: "Reviewed by" },
          {
            key: "id",
            header: "",
            render: (r) =>
              r.status === "pending" ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={savingId === r.id}
                    onClick={() => void review(r.id, "approved")}
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={savingId === r.id}
                    onClick={() => void review(r.id, "rejected")}
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
