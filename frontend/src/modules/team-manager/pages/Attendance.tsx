import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAppSelector } from "@/store";
import { MapPin } from "lucide-react";
import { attendanceMapUrl, formatAttendanceLocation } from "@/lib/attendanceLocation";
import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TeamFilter } from "@/modules/teams/TeamFilter";
import { useManagedTeams, todayInIndia } from "@/modules/teams/useManagedTeams";
import { useTeamActivityRefresh } from "@/modules/teams/useTeamActivityRefresh";
export default function P() {
  const { attendance } = useAppSelector((s) => s.workspace);
  const [params, setParams] = useSearchParams();
  const selected = params.get("team") || "all";
  const { teams, members: employees, memberIds } = useManagedTeams(selected);
  const [date, setDate] = useState(todayInIndia());
  const { refresh, error } = useTeamActivityRefresh();
  const rows = attendance
    .filter((record) => memberIds.has(record.employeeId || "") && (!date || record.date === date))
    .map((record) => {
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
      <PageHeader
        title="Team Attendance"
        subtitle="Check attendance, work hours, and check-in locations for your team."
        actions={
          <Button variant="outline" onClick={() => void refresh()}>
            Refresh attendance
          </Button>
        }
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-end gap-3">
        <TeamFilter
          teams={teams}
          value={selected}
          onChange={(id) => setParams(id === "all" ? {} : { team: id })}
        />
        <div>
          <Label htmlFor="team-attendance-date">Date (IST)</Label>
          <Input
            id="team-attendance-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
        <Button variant="ghost" onClick={() => setDate("")}>
          All dates
        </Button>
      </div>
      <DataTable
        key={`${selected}:${date}`}
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
