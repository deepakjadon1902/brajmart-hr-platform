import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { DataTable } from "@/components/common/DataTable";
import { ExportButtons } from "@/components/common/ExportButtons";
import { Card } from "@/components/ui/card";
import { Clock, MapPin, Activity } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAppSelector } from "@/store";
import { AttendanceButton } from "@/components/common/AttendanceButton";
import { currentAttendance } from "@/lib/attendance";
import { attendanceMapUrl, formatAttendanceLocation } from "@/lib/attendanceLocation";

function formatDuration(hours = 0) {
  const totalMinutes = Math.round(hours * 60);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`;
}

export default function Attendance() {
  const [loc, setLoc] = useState("Detecting...");
  const user = useAppSelector((s) => s.auth.user);
  const { attendance, employees } = useAppSelector((s) => s.workspace);
  const currentEmployee = employees.find((employee) => employee.id === user?.id) ?? user;
  const employeeAttendance = attendance.filter(
    (record) => record.employeeId === currentEmployee?.id,
  );
  const todayRecord = currentAttendance(employeeAttendance);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setLoc(`${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`),
      () => setLoc("Location unavailable"),
    );
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" subtitle="Track your check-ins, hours and history." />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Geolocation Check-in
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-xl border bg-muted/30 p-3 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="truncate">{loc}</span>
          </div>
          <AttendanceButton employee={currentEmployee} record={todayRecord} onLocation={setLoc} />
        </Card>
        <StatCard
          label="Today"
          value={formatDuration(todayRecord?.hoursWorked ?? 0)}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          label="This month"
          value={formatDuration(
            employeeAttendance.reduce((sum, record) => sum + (record.hoursWorked ?? 0), 0),
          )}
          delta={`${employeeAttendance.length} records`}
          icon={<Activity className="h-5 w-5" />}
          tone="success"
        />
      </div>

      <DataTable
        data={employeeAttendance}
        searchKeys={["date", "status"]}
        columns={[
          { key: "date", header: "Date" },
          { key: "checkIn", header: "Check In" },
          { key: "checkOut", header: "Check Out" },
          {
            key: "hoursWorked",
            header: "Hours",
            render: (r) => formatDuration(r.hoursWorked ?? 0),
          },
          {
            key: "location",
            header: "Location",
            render: (r) => {
              const text = formatAttendanceLocation(r.location);
              const mapUrl = attendanceMapUrl(r.location);
              return mapUrl ? (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {text}
                </a>
              ) : (
                text
              );
            },
          },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]}
        toolbar={<ExportButtons rows={employeeAttendance} filename="attendance" />}
      />
    </div>
  );
}
