import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { holidays } from "@/services/mock";
import { StatusBadge } from "@/components/common/StatusBadge";

export default function Holidays() {
  return (
    <div className="space-y-6">
      <PageHeader title="Holiday Management" subtitle="Configure company and public holidays."
        actions={<Button><Plus className="mr-2 h-4 w-4" />Add holiday</Button>} />
      <DataTable data={holidays} searchKeys={["name","type"]}
        columns={[
          { key: "name", header: "Name" },
          { key: "date", header: "Date" },
          { key: "type", header: "Type", render: (h) => <StatusBadge status={h.type} /> },
        ]}
      />
    </div>
  );
}
