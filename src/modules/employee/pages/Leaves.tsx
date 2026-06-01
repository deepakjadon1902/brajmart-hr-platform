import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CalendarDays, CalendarCheck, CalendarX } from "lucide-react";
import { leaves } from "@/services/mock";
import { StatusBadge } from "@/components/common/StatusBadge";
import { toast } from "sonner";

export default function Leaves() {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-6">
      <PageHeader title="Leave Requests" subtitle="Apply for leave and track approvals."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Apply Leave</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Apply for leave</DialogTitle></DialogHeader>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("Leave request submitted"); setOpen(false); }}>
                <div><Label>Leave type</Label>
                  <Select defaultValue="casual"><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casual">Casual</SelectItem><SelectItem value="sick">Sick</SelectItem>
                      <SelectItem value="earned">Earned</SelectItem><SelectItem value="unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>From</Label><Input type="date" className="mt-1" required /></div>
                  <div><Label>To</Label><Input type="date" className="mt-1" required /></div>
                </div>
                <div><Label>Reason</Label><Textarea className="mt-1" rows={3} maxLength={400} required /></div>
                <Button type="submit" className="w-full">Submit request</Button>
              </form>
            </DialogContent>
          </Dialog>
        } />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Approved" value="08" icon={<CalendarCheck className="h-5 w-5" />} tone="success" />
        <StatCard label="Pending"  value="02" icon={<CalendarDays className="h-5 w-5" />} tone="warning" />
        <StatCard label="Balance"  value="14" icon={<CalendarX className="h-5 w-5" />} tone="info" />
      </div>

      <DataTable data={leaves}
        searchKeys={["type","status","reason"]}
        columns={[
          { key: "type", header: "Type", render: (r) => <span className="capitalize">{r.type}</span> },
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
