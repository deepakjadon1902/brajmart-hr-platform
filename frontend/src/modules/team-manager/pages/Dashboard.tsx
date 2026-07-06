import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card } from "@/components/ui/card";
import { Award, CalendarCheck, ClipboardList, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAppSelector } from "@/store";

export default function D() {
  const { employees, attendance } = useAppSelector((s) => s.workspace);
  const today = new Date().toISOString().slice(0, 10);
  const presentToday = attendance.filter(
    (record) => record.date === today && record.status === "present",
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Team Dashboard" subtitle="Track your team's day-to-day at a glance." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Team size"
          value={String(employees.length)}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Present today"
          value={String(presentToday)}
          tone="success"
          icon={<CalendarCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Open tasks"
          value="0"
          tone="warning"
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <StatCard label="Avg rating" value="-" tone="info" icon={<Award className="h-5 w-5" />} />
      </div>
      <Card className="p-6 shadow-soft">
        <h3 className="font-semibold">My team</h3>
        {employees.length ? (
          <ul className="mt-4 space-y-3">
            {employees.slice(0, 6).map((e) => (
              <li key={e.id} className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    {e.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{e.designation}</p>
                </div>
                <StatusBadge status={e.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No employee records found in the database.
          </p>
        )}
      </Card>
    </div>
  );
}
