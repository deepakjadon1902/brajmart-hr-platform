import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";

const rows = [
  { id: "x1", name: "Ravi Kumar", date: "2025-06-30", checklist: "pending", clearance: "in-repair" },
  { id: "x2", name: "Maya Pillai", date: "2025-07-12", checklist: "approved", clearance: "assigned" },
];

export default function Exit() {
  return (
    <div className="space-y-6">
      <PageHeader title="Exit Management" subtitle="Review resignations and clearances." />
      <DataTable data={rows} searchKeys={["name"]}
        columns={[
          { key: "name", header: "Employee" },
          { key: "date", header: "Last working day" },
          { key: "checklist", header: "Checklist", render: (r) => <StatusBadge status={r.checklist} /> },
          { key: "clearance", header: "Assets", render: (r) => <StatusBadge status={r.clearance} /> },
        ]}
      />
    </div>
  );
}
