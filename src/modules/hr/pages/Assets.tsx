import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { assets } from "@/services/mock";

export default function Assets() {
  return (
    <div className="space-y-6">
      <PageHeader title="Asset Management" subtitle="All company assets and assignments." />
      <DataTable data={assets} searchKeys={["name","type","status"]}
        columns={[
          { key: "name", header: "Asset" },
          { key: "type", header: "Type" },
          { key: "serial", header: "Serial" },
          { key: "assignedOn", header: "Assigned" },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
    </div>
  );
}
