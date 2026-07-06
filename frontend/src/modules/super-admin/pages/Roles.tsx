import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { useAppSelector } from "@/store";

export default function P() {
  const rows = useAppSelector((s) => s.workspace.roleAssignments);

  return (
    <div className="space-y-6">
      <PageHeader title="Role Management" subtitle="View assigned roles and employee work scope." />
      <DataTable
        data={rows}
        searchKeys={["employeeName", "roleName", "workScope"]}
        columns={[
          { key: "employeeName", header: "Employee" },
          { key: "roleName", header: "Role" },
          { key: "workScope", header: "Work Scope" },
        ]}
      />
    </div>
  );
}
