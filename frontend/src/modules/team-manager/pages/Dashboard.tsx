import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card } from "@/components/ui/card";
import { CalendarDays, CalendarCheck, ClipboardList, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAppSelector } from "@/store";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useManagedTeams, todayInIndia } from "@/modules/teams/useManagedTeams";
import { useTeamActivityRefresh } from "@/modules/teams/useTeamActivityRefresh";

export default function D() {
  const { attendance, tasks, leaves } = useAppSelector((s) => s.workspace);
  const { members: employees, memberIds } = useManagedTeams();
  const { error } = useTeamActivityRefresh();
  const today = todayInIndia();
  const presentToday = new Set(
    attendance
      .filter(
        (record) =>
          memberIds.has(record.employeeId || "") &&
          record.date === today &&
          ["present", "late", "half-day"].includes(record.status),
      )
      .map((record) => record.employeeId),
  ).size;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Dashboard"
        subtitle="Track your team's day-to-day at a glance."
        actions={
          <Button asChild>
            <Link to="/team-manager/teams">Manage teams</Link>
          </Button>
        }
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
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
          value={String(
            tasks.filter((task) => memberIds.has(task.employeeId) && task.status !== "completed")
              .length,
          )}
          tone="warning"
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <StatCard
          label="Pending leave"
          value={String(
            leaves.filter(
              (leave) => memberIds.has(leave.employeeId || "") && leave.status === "pending",
            ).length,
          )}
          tone="info"
          icon={<CalendarDays className="h-5 w-5" />}
        />
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
                {leaves.some(
                  (leave) =>
                    leave.employeeId === e.id &&
                    leave.status === "approved" &&
                    leave.from <= today &&
                    leave.to >= today,
                ) ? (
                  <StatusBadge status="on-leave" />
                ) : attendance.some(
                    (record) => record.employeeId === e.id && record.date === today,
                  ) ? (
                  <StatusBadge
                    status={
                      attendance.find(
                        (record) => record.employeeId === e.id && record.date === today,
                      )!.status
                    }
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">Not checked in</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Create a team and select its members to see their activity here.
          </p>
        )}
      </Card>
    </div>
  );
}
