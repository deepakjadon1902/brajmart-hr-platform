import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAppSelector } from "@/store";
import { MapPin } from "lucide-react";
import { attendanceMapUrl, formatAttendanceLocation } from "@/lib/attendanceLocation";
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
      locationText: formatAttendanceLocation(record.location),
      mapUrl: attendanceMapUrl(record.location),
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Team Attendance" subtitle="Your team's attendance today." />
      <DataTable
        data={rows}
        searchKeys={["name", "status", "locationText"]}
        columns={[
          { key: "name", header: "Member" },
          { key: "date", header: "Date" },
          { key: "checkIn", header: "In" },
          { key: "checkOut", header: "Out" },
          { key: "hours", header: "Hours" },
          {
            key: "locationText",
            header: "Location",
            render: (r) =>
              r.mapUrl ? (
                <a
                  href={r.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {r.locationText}
                </a>
              ) : (
                r.locationText
              ),
          },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
    </div>
  );
}
