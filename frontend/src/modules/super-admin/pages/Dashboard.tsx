import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
  Users,
  UserX,
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

function displayToday() {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function roleLabel(value: string) {
  return value
    .split("-")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

export default function Dashboard() {
  const { employees, tasks } = useAppSelector((state) => state.workspace);
  const { list: companies, activeId } = useAppSelector((state) => state.company);
  const selectedCompany = companies.find(
    (company) => company.id === activeId || company.companyId === activeId,
  );
  const companyName = selectedCompany?.name || "Selected company";
  const activeUsers = employees.filter((employee) => employee.status !== "inactive");
  const inactiveUsers = employees.filter((employee) => employee.status === "inactive");
  const onLeaveUsers = employees.filter((employee) => employee.status === "on-leave");
  const openTasks = tasks.filter((task) => task.status !== "completed");
  const overdueTasks = openTasks.filter((task) => Boolean(task.dueDate && task.dueDate < todayInIndia()));

  const roleDistribution = Object.entries(
    employees.reduce<Record<string, number>>((counts, employee) => {
      counts[employee.role] = (counts[employee.role] ?? 0) + 1;
      return counts;
    }, {}),
  ).sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]));

  const taskStatuses = [
    { label: "Not started", value: tasks.filter((task) => task.status === "not-started").length, tone: "amber" as const },
    { label: "In progress", value: tasks.filter((task) => task.status === "in-progress").length, tone: "blue" as const },
    { label: "Completed", value: tasks.filter((task) => task.status === "completed").length, tone: "green" as const },
  ];
  const todayLabel = displayToday();

  return (
    <div className="space-y-5 pb-6">
      <DashboardHero
        eyebrow="Platform administration"
        title="Organization overview"
        description={`Company-wide controls with user and workload details for ${companyName}. Change the company selector above to review another workspace.`}
        date={todayLabel}
        actions={
          <>
            <Button asChild variant="secondary" className="bg-white text-slate-900 hover:bg-slate-100">
              <Link to="/super-admin/companies">Manage companies</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-slate-600 bg-slate-900 text-white hover:bg-slate-800 hover:text-white"
            >
              <Link to="/super-admin/users">Manage users</Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric
          label="Companies"
          value={companies.length}
          note="Registered workspaces"
          icon={<Building2 className="h-4 w-4" />}
          tone="blue"
        />
        <DashboardMetric
          label="Users in selected company"
          value={employees.length}
          note={companyName}
          icon={<Users className="h-4 w-4" />}
          tone="violet"
        />
        <DashboardMetric
          label="Enabled accounts"
          value={activeUsers.length}
          note={`${inactiveUsers.length} inactive · ${onLeaveUsers.length} on leave`}
          icon={<ShieldCheck className="h-4 w-4" />}
          tone="green"
        />
        <DashboardMetric
          label="Open tasks"
          value={openTasks.length}
          note={`${overdueTasks.length} overdue in this workspace`}
          icon={<ClipboardList className="h-4 w-4" />}
          tone={overdueTasks.length ? "red" : "cyan"}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardPanel
          title="Account access"
          description={`Current status of ${employees.length} user accounts in ${companyName}.`}
          action={<UserX className="h-4 w-4 text-slate-400" />}
        >
          {employees.length ? (
            <div className="space-y-5">
              <DashboardProgress label="Active" value={activeUsers.length - onLeaveUsers.length} total={employees.length} tone="green" />
              <DashboardProgress label="On leave" value={onLeaveUsers.length} total={employees.length} tone="amber" />
              <DashboardProgress label="Inactive" value={inactiveUsers.length} total={employees.length} tone="red" />
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                Disabled accounts remain in the directory for historical reference.
              </div>
            </div>
          ) : (
            <EmptyPanelMessage message={`No user accounts are available for ${companyName}.`} />
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Role distribution"
          description="Portal roles currently assigned in the selected company."
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/super-admin/roles">
                Review roles <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          }
        >
          {roleDistribution.length ? (
            <div className="space-y-5">
              {roleDistribution.map(([role, count]) => (
                <DashboardProgress
                  key={role}
                  label={roleLabel(role)}
                  value={count}
                  total={employees.length}
                  tone="blue"
                  detail={`${Math.round((count / employees.length) * 100)}%`}
                />
              ))}
            </div>
          ) : (
            <EmptyPanelMessage message="Role distribution will appear when user accounts are available." />
          )}
        </DashboardPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardPanel
          title="Company directory"
          description="All registered workspaces and the company currently in view."
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/super-admin/companies">
                Company settings <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          }
        >
          {companies.length ? (
            <div className="divide-y divide-slate-100">
              {companies.map((company) => {
                const isSelected = company.id === activeId || company.companyId === activeId;
                return (
                  <div key={company.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700"
                    >
                      {company.name.slice(0, 1).toUpperCase() || "C"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{company.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">Workspace ID · {company.companyId || company.id}</p>
                    </div>
                    {isSelected && (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        In view
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyPanelMessage message="No company workspaces have been registered." />
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Task portfolio"
          description={`${tasks.length} assigned tasks in ${companyName}.`}
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/super-admin/tasks">
                View tasks <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          }
        >
          {tasks.length ? (
            <div className="space-y-5">
              {taskStatuses.map((item) => (
                <DashboardProgress
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  total={tasks.length}
                  tone={item.tone}
                />
              ))}
              <div className={`rounded-lg px-3 py-2.5 text-sm ${overdueTasks.length ? "bg-rose-50 text-rose-800" : "bg-slate-50 text-slate-600"}`}>
                {overdueTasks.length
                  ? `${overdueTasks.length} task${overdueTasks.length === 1 ? " is" : "s are"} past due.`
                  : "No tasks are past their due date."}
              </div>
            </div>
          ) : (
            <EmptyPanelMessage message={`No tasks are assigned in ${companyName}.`} />
          )}
        </DashboardPanel>
      </section>
    </div>
  );
}

function EmptyPanelMessage({ message }: { message: string }) {
  return <p className="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-500">{message}</p>;
}
