import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card } from "@/components/ui/card";
import { Users, UserCheck, UserMinus, Briefcase } from "lucide-react";
import { useAppSelector } from "@/store";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export default function Dashboard() {
  const { employees, attendance } = useAppSelector((s) => s.workspace);
  const today = new Date().toISOString().slice(0, 10);
  const presentToday = attendance.filter(
    (record) => record.date === today && record.status === "present",
  ).length;
  const onLeave = employees.filter((employee) => employee.status === "on-leave").length;
  const dept = Object.entries(
    employees.reduce<Record<string, number>>((acc, employee) => {
      const department = employee.department ?? "Unassigned";
      acc[department] = (acc[department] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <PageHeader title="HR Dashboard" subtitle="A pulse on your people operations." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total employees"
          value={String(employees.length)}
          delta="Live headcount"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Present today"
          value={String(presentToday)}
          delta={`${Math.round((presentToday / Math.max(employees.length, 1)) * 100)}% attendance`}
          icon={<UserCheck className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label="On leave"
          value={String(onLeave)}
          delta={`${Math.round((onLeave / Math.max(employees.length, 1)) * 100)}%`}
          icon={<UserMinus className="h-5 w-5" />}
          tone="warning"
        />
        <StatCard
          label="Open roles"
          value="0"
          delta="No recruitment records"
          icon={<Briefcase className="h-5 w-5" />}
          tone="info"
        />
      </div>

      <Card className="p-6 shadow-soft">
        <h3 className="font-semibold">Department split</h3>
        <div className="mt-4 h-64">
          {dept.length ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={dept}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {dept.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No employee records found in the database.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
