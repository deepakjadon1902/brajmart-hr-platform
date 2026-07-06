import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { useAppSelector } from "@/store";

export default function Onboarding() {
  const employees = useAppSelector((s) => s.workspace.employees);
  const data = employees.map((e) => ({
    id: e.id,
    name: e.name,
    dept: e.department,
    start: e.joinDate,
    status: e.status,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Onboarding Management" subtitle="Track new hire onboarding progress." />
      <DataTable
        data={data}
        emptyMessage="No employee onboarding records found in the database"
        searchKeys={["name", "dept"]}
        columns={[
          { key: "name", header: "New Hire" },
          { key: "dept", header: "Department" },
          { key: "start", header: "Start date" },
          { key: "status", header: "Status" },
        ]}
      />
    </div>
  );
}
