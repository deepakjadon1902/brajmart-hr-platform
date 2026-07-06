import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";

const rows: {
  id: string;
  name: string;
  date: string;
  checklist: string;
  clearance: string;
}[] = [];

export default function Exit() {
  return (
    <div className="space-y-6">
      <PageHeader title="Exit Management" subtitle="Review resignations and clearances." />
      <DataTable
        data={rows}
        emptyMessage="No exit records found in the database"
        searchKeys={["name"]}
        columns={[
          { key: "name", header: "Employee" },
          { key: "date", header: "Last working day" },
          {
            key: "checklist",
            header: "Checklist",
            render: (r) => <StatusBadge status={r.checklist} />,
          },
          {
            key: "clearance",
            header: "Assets",
            render: (r) => <StatusBadge status={r.clearance} />,
          },
        ]}
      />
    </div>
  );
}
