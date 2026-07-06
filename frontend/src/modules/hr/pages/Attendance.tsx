import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { ExportButtons } from "@/components/common/ExportButtons";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAppSelector } from "@/store";

export default function Attendance() {
  const { attendance, employees } = useAppSelector((s) => s.workspace);
  const rows = attendance.map((record) => {
    const employee = employees.find((item) => item.id === record.employeeId);
    return {
      id: record.id,
      name: record.employeeName ?? employee?.name ?? "Employee",
      dept: employee?.department ?? "Unassigned",
      date: record.date,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      hours: record.hoursWorked,
      status: record.status,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" subtitle="Company-wide attendance overview." />
      <DataTable
        data={rows}
        searchKeys={["name", "dept", "status"]}
        toolbar={<ExportButtons rows={rows} filename="attendance" />}
        columns={[
          { key: "name", header: "Employee" },
          { key: "dept", header: "Department" },
          { key: "date", header: "Date" },
          { key: "checkIn", header: "Check In" },
          { key: "checkOut", header: "Check Out" },
          { key: "hours", header: "Hours" },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
    </div>
  );
}
