import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { ExportButtons } from "@/components/common/ExportButtons";
import { StatusBadge } from "@/components/common/StatusBadge";
import { employees, attendance } from "@/services/mock";

const rows = employees.slice(0, 12).map((e, i) => ({
  id: e.id, name: e.name, dept: e.department,
  date: attendance[i % attendance.length].date,
  checkIn: attendance[i % attendance.length].checkIn,
  hours: attendance[i % attendance.length].hoursWorked,
  status: attendance[i % attendance.length].status,
}));

export default function Attendance() {
  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" subtitle="Company-wide attendance overview." />
      <DataTable data={rows}
        searchKeys={["name","dept","status"]}
        toolbar={<ExportButtons rows={rows} filename="attendance" />}
        columns={[
          { key: "name", header: "Employee" },
          { key: "dept", header: "Department" },
          { key: "date", header: "Date" },
          { key: "checkIn", header: "Check In" },
          { key: "hours", header: "Hours" },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
    </div>
  );
}
