import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAppSelector } from "@/store";
export default function P() {
  const { employees, attendance } = useAppSelector((s) => s.workspace);
  const rows = attendance.slice(0, 12).map((record) => {
    const employee = employees.find((item) => item.id === record.employeeId);
    return {
      id: record.id,
      name: record.employeeName ?? employee?.name ?? "Employee",
      date: record.date,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      hours: record.hoursWorked,
      status: record.status,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Team Attendance" subtitle="Your team's attendance today." />
      <DataTable
        data={rows}
        searchKeys={["name", "status"]}
        columns={[
          { key: "name", header: "Member" },
          { key: "date", header: "Date" },
          { key: "checkIn", header: "In" },
          { key: "checkOut", header: "Out" },
          { key: "hours", header: "Hours" },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
    </div>
  );
}
