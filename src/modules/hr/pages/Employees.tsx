import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { ExportButtons } from "@/components/common/ExportButtons";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Plus } from "lucide-react";
import { employees } from "@/services/mock";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function Employees() {
  return (
    <div className="space-y-6">
      <PageHeader title="Employee Management" subtitle="View and manage your workforce."
        actions={<Button onClick={() => toast.info("Open add employee flow")}><Plus className="mr-2 h-4 w-4" />Add employee</Button>} />
      <DataTable data={employees}
        searchKeys={["name","email","department","designation","location"]}
        toolbar={<ExportButtons rows={employees} filename="employees" />}
        columns={[
          { key: "name", header: "Employee", render: (e) => (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary/10 text-xs text-primary">{e.name.split(" ").map(n=>n[0]).slice(0,2).join("")}</AvatarFallback></Avatar>
              <div><p className="font-medium">{e.name}</p><p className="text-xs text-muted-foreground">{e.email}</p></div>
            </div>) },
          { key: "department", header: "Department" },
          { key: "designation", header: "Designation" },
          { key: "location", header: "Location" },
          { key: "joinDate", header: "Joined" },
          { key: "status", header: "Status", render: (e) => <StatusBadge status={e.status} /> },
        ]}
      />
    </div>
  );
}
