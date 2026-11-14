import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DashboardHero,
  DashboardMetric,
  DashboardPanel,
  DashboardProgress,
} from "@/components/common/DashboardComponents";
import { useAppSelector } from "@/store";
import { todayInIndia } from "@/utils/date";

function formatDate(value?: string) {
  if (!value) return "Date not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date not set" : date.toLocaleDateString("en-IN");
}

function displayToday() {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export default function Dashboard() {
  const { employees, attendance, leaves, tasks } = useAppSelector((state) => state.workspace);
  const today = todayInIndia();

  const workforce = employees.filter(
    (employee) => employee.role !== "super-admin" && employee.status !== "inactive",
  );
  const onLeave = workforce.filter((employee) => employee.status === "on-leave").length;

  const attendanceByEmployee = new Map<string, (typeof attendance)[number]>();
  attendance
    .filter((record) => record.date === today)
    .forEach((record) => {
      const key = record.employeeId || record.employeeName || record.id;
      if (!attendanceByEmployee.has(key)) attendanceByEmployee.set(key, record);
    });
  const todayRecords = [...attendanceByEmployee.values()];
  const countAttendance = (status: string) =>
    todayRecords.filter((record) => record.status === status).length;

  const pendingLeaves = leaves.filter((leave) => leave.status === "pending");
  const openTasks = tasks.filter((task) => task.status !== "completed");
  const overdueTasks = openTasks.filter((task) => Boolean(task.dueDate && task.dueDate < today));
  const expectedToday = Math.max(0, workforce.length - onLeave);
  const recordedForWork = todayRecords.filter((record) => record.status !== "leave").length;
  const noAttendance = Math.max(0, expectedToday - recordedForWork);

  const departments = Object.entries(
    workforce.reduce<Record<string, number>>((counts, employee) => {
      const department = employee.department?.trim() || "Unassigned";
      counts[department] = (counts[department] ?? 0) + 1;
      return counts;
    }, {}),
  )
    .map(([name, count]) => ({ name, count }))
    .sort((first, second) => second.count - first.count || first.name.localeCompare(second.name));

  const activity = [
    ...workforce
      .filter((employee) => employee.joinDate)
      .map((employee) => ({
        id: `joined-${employee.id}`,
        name: employee.name,
        detail: [employee.designation, employee.department].filter(Boolean).join(" · ") || "New team member",
        date: employee.joinDate || "",
        kind: "Joined" as const,
      })),
    ...employees
      .filter((employee) => employee.status === "inactive" && employee.exitDate)
      .map((employee) => ({
        id: `exited-${employee.id}`,
        name: employee.name,
        detail: [employee.designation, employee.department].filter(Boolean).join(" · ") || "Past employee",
        date: employee.exitDate || "",
        kind: "Exited" as const,
      })),
  ]
    .sort((first, second) => second.date.localeCompare(first.date))
    .slice(0, 6);

  const dateLabel = displayToday();

  return (
    <div className="space-y-5 pb-6">
      <DashboardHero
        eyebrow="People operations"
        title="HR overview"
        description="A working view of today’s attendance, employee movement and follow-ups for your team."
        date={dateLabel}
        actions={
          <>
            <Button
              asChild
              variant="secondary"
              className="bg-white text-slate-900 hover:bg-slate-100"
            >
              <Link to="/hr/employees">Employee directory</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-slate-600 bg-slate-900 text-white hover:bg-slate-800 hover:text-white"
            >
              <Link to="/hr/leaves">Review requests</Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric
          label="Active employees"
          value={workforce.length}
          note={`${onLeave} currently on leave`}
          icon={<Users className="h-4 w-4" />}
          tone="blue"
        />
        <DashboardMetric
          label="Present today"
          value={countAttendance("present")}
          note={`${countAttendance("late")} late · ${countAttendance("half-day")} half-day`}
          icon={<CalendarCheck2 className="h-4 w-4" />}
          tone="green"
        />
        <DashboardMetric
          label="Pending leave requests"
          value={pendingLeaves.length}
          note={pendingLeaves.length ? "Waiting for HR review" : "No requests need review"}
          icon={<CalendarDays className="h-4 w-4" />}
          tone={pendingLeaves.length ? "amber" : "green"}
        />
        <DashboardMetric
          label="Open tasks"
          value={openTasks.length}
          note={`${overdueTasks.length} overdue`}
          icon={<ClipboardList className="h-4 w-4" />}
          tone={overdueTasks.length ? "red" : "violet"}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardPanel
          title="Today’s attendance"
          description={`${todayRecords.length} attendance records · ${expectedToday} employees expected`}
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/hr/attendance">
                Attendance log <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          }
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-600">Attendance recorded</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-950">
                  {recordedForWork}
                  <span className="ml-1 text-base font-normal text-slate-500">/ {expectedToday}</span>
                </p>
              </div>
              <span className="text-sm text-slate-500">
                {expectedToday ? Math.round((recordedForWork / expectedToday) * 100) : 0}% of expected team
              </span>
            </div>
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <DashboardProgress label="Present" value={countAttendance("present")} total={workforce.length} tone="green" />
              <DashboardProgress label="Late" value={countAttendance("late")} total={workforce.length} tone="amber" />
              <DashboardProgress label="Half-day" value={countAttendance("half-day")} total={workforce.length} tone="violet" />
              <DashboardProgress label="Absent" value={countAttendance("absent")} total={workforce.length} tone="red" />
              <DashboardProgress label="On leave" value={onLeave} total={workforce.length} tone="blue" />
              <DashboardProgress label="No attendance record" value={noAttendance} total={workforce.length} tone="cyan" />
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Department mix"
          description={`${departments.length} departments across the active workforce`}
        >
          {departments.length ? (
            <div className="space-y-5">
              {departments.slice(0, 7).map((department) => (
                <DashboardProgress
                  key={department.name}
                  label={department.name}
                  value={department.count}
                  total={workforce.length}
                  tone="blue"
                  detail={`${Math.round((department.count / workforce.length) * 100)}%`}
                />
              ))}
              {departments.length > 7 && (
                <p className="text-xs text-slate-500">Showing 7 of {departments.length} departments</p>
              )}
            </div>
          ) : (
            <EmptyPanelMessage message="Department details will appear when employee profiles are assigned to teams." />
          )}
        </DashboardPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardPanel
          title="Needs attention"
          description="Items that may need an HR follow-up today."
          action={
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {pendingLeaves.length + overdueTasks.length} items
            </span>
          }
        >
          {pendingLeaves.length || overdueTasks.length ? (
            <div className="space-y-4">
              {pendingLeaves.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">Leave requests</p>
                    <Link to="/hr/leaves" className="text-xs font-semibold text-primary hover:underline">
                      Review all
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 px-3">
                    {pendingLeaves.slice(0, 3).map((leave) => (
                      <div key={leave.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">{leave.employeeName || "Employee"}</p>
                          <p className="mt-0.5 text-xs capitalize text-slate-500">{leave.type} leave · {leave.from} to {leave.to}</p>
                        </div>
                        <Clock3 className="h-4 w-4 shrink-0 text-amber-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {overdueTasks.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">Overdue tasks</p>
                    <Link to="/hr/tasks" className="text-xs font-semibold text-primary hover:underline">
                      Open tasks
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 px-3">
                    {overdueTasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">{task.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{task.employeeName} · due {formatDate(task.dueDate)}</p>
                        </div>
                        <Activity className="h-4 w-4 shrink-0 text-rose-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">Nothing waiting for follow-up</p>
                <p className="mt-0.5 text-xs text-emerald-800">No pending leave requests or overdue tasks.</p>
              </div>
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Recent workforce changes"
          description="Latest joining and exit dates on employee records."
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/hr/exit">
                Exit records <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          }
        >
          {activity.length ? (
            <div className="divide-y divide-slate-100">
              {activity.map((item) => {
                const joined = item.kind === "Joined";
                return (
                  <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className={`rounded-lg p-2 ${joined ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {joined ? <UserPlus className="h-4 w-4" /> : <UserMinus className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
                      <p className="truncate text-xs text-slate-500">{item.detail}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`text-xs font-semibold ${joined ? "text-emerald-700" : "text-slate-500"}`}>{item.kind}</span>
                      <p className="mt-0.5 text-xs tabular-nums text-slate-500">{formatDate(item.date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyPanelMessage message="Joining and exit activity will appear here when dates are recorded." />
          )}
        </DashboardPanel>
      </section>
    </div>
  );
}

function EmptyPanelMessage({ message }: { message: string }) {
  return <p className="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-500">{message}</p>;
}
