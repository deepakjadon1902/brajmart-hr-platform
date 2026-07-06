import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { ExportButtons } from "@/components/common/ExportButtons";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAppSelector } from "@/store";
export default function P() {
  const { employees, clients } = useAppSelector((s) => s.workspace);
  const rows = [
    ...employees.map((employee) => ({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      type: "Employee",
      department: employee.department ?? "Unassigned",
      designation: employee.designation ?? "Employee",
      status: employee.status,
    })),
    ...clients.map((client) => ({
      id: client.id,
      name: client.name,
      email: client.email,
      type: "Client",
      department: client.domain,
      designation: client.owner,
      status: client.status,
    })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Users" subtitle="All platform users across companies." />
      <DataTable
        data={rows}
        searchKeys={["name", "email", "department", "type"]}
        toolbar={<ExportButtons rows={rows} filename="users-and-clients" />}
        columns={[
          { key: "name", header: "Name" },
          { key: "email", header: "Email" },
          { key: "type", header: "Type" },
          { key: "department", header: "Dept" },
          { key: "designation", header: "Designation" },
          { key: "status", header: "Status", render: (e) => <StatusBadge status={e.status} /> },
        ]}
      />
    </div>
  );
}
