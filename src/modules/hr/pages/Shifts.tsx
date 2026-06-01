import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { shifts } from "@/services/mock";

export default function Shifts() {
  return (
    <div className="space-y-6">
      <PageHeader title="Shift Management" subtitle="Plan and manage shift rotations." />
      <DataTable data={shifts} searchKeys={["name"]}
        columns={[
          { key: "name", header: "Shift" },
          { key: "start", header: "Start" },
          { key: "end", header: "End" },
          { key: "employees", header: "Employees" },
        ]}
      />
    </div>
  );
}
