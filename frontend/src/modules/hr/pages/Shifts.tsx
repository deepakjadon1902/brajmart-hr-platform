import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { useAppSelector } from "@/store";

export default function Shifts() {
  const shifts = useAppSelector((s) => s.workspace.shifts);

  return (
    <div className="space-y-6">
      <PageHeader title="Shift Management" subtitle="Plan and manage shift rotations." />
      <DataTable
        data={shifts}
        searchKeys={["name"]}
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
