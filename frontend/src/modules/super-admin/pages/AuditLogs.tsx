import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";

const rows: { id: string; when: string; actor: string; action: string; target: string }[] = [];

export default function P() {
  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" subtitle="Who did what and when." />
      <DataTable
        data={rows}
        emptyMessage="No audit logs found in the database"
        searchKeys={["actor", "action", "target"]}
        columns={[
          { key: "when", header: "Time" },
          { key: "actor", header: "Actor" },
          { key: "action", header: "Action" },
          { key: "target", header: "Target" },
        ]}
      />
    </div>
  );
}
