import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, CalendarDays, CalendarCheck, CalendarX } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store";
import { applyLeave } from "@/store/slices/workspaceSlice";
import type { LeaveRequest } from "@/types";

export default function Leaves() {
  const [open, setOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveRequest["type"]>("casual");
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { leaves, employees } = useAppSelector((s) => s.workspace);
  const currentEmployee = employees.find((employee) => employee.id === user?.id) ?? user;
  const employeeLeaves = leaves.filter((leave) => leave.employeeId === currentEmployee?.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Requests"
        subtitle="Apply for leave and track approvals."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Apply Leave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apply for leave</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!currentEmployee) return;
                  const form = new FormData(e.currentTarget);
                  try {
                    await dispatch(
                      applyLeave({
                        type: leaveType,
                        from: String(form.get("from") ?? ""),
                        to: String(form.get("to") ?? ""),
                        reason: String(form.get("reason") ?? "").trim(),
                      }),
                    ).unwrap();
                    toast.success("Leave request submitted");
                    setOpen(false);
                    e.currentTarget.reset();
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Unable to submit leave");
                  }
                }}
              >
                <div>
                  <Label>Leave type</Label>
                  <Select
                    value={leaveType}
                    onValueChange={(value) => setLeaveType(value as LeaveRequest["type"])}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="sick">Sick</SelectItem>
                      <SelectItem value="earned">Earned</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>From</Label>
                    <Input name="from" type="date" className="mt-1" required />
                  </div>
                  <div>
                    <Label>To</Label>
                    <Input name="to" type="date" className="mt-1" required />
                  </div>
                </div>
                <div>
                  <Label>Reason</Label>
                  <Textarea name="reason" className="mt-1" rows={3} maxLength={400} required />
                </div>
                <Button type="submit" className="w-full">
                  Submit request
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Approved"
          value={String(
            employeeLeaves.filter((leave) => leave.status === "approved").length,
          ).padStart(2, "0")}
          icon={<CalendarCheck className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label="Pending"
          value={String(
            employeeLeaves.filter((leave) => leave.status === "pending").length,
          ).padStart(2, "0")}
          icon={<CalendarDays className="h-5 w-5" />}
          tone="warning"
        />
        <StatCard label="Balance" value="14" icon={<CalendarX className="h-5 w-5" />} tone="info" />
      </div>

      <DataTable
        data={employeeLeaves}
        searchKeys={["type", "status", "reason"]}
        columns={[
          {
            key: "type",
            header: "Type",
            render: (r) => <span className="capitalize">{r.type}</span>,
          },
          { key: "from", header: "From" },
          { key: "to", header: "To" },
          { key: "reason", header: "Reason" },
          { key: "appliedOn", header: "Applied" },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
    </div>
  );
}
