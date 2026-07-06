import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
const rows = Array.from({ length: 18 }).map((_, i) => ({
  id: `a${i}`,
  when: new Date(Date.now() - i * 3600_000).toLocaleString(),
  actor: ["Megha", "Priya", "System", "Vikram"][i % 4],
  action: ["Login", "Updated role", "Created user", "Approved leave", "Exported report"][i % 5],
  target: ["e12", "r2", "u14", "l3", "attendance"][i % 5],
}));
export default function P() {
  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" subtitle="Who did what and when." />
      <DataTable
        data={rows}
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
