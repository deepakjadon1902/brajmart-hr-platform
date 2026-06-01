import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card } from "@/components/ui/card";
import { Users, UserCheck, UserMinus, Briefcase, TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";

const hiring = [{ m: "Jan", v: 4 }, { m: "Feb", v: 8 }, { m: "Mar", v: 6 }, { m: "Apr", v: 12 }, { m: "May", v: 9 }, { m: "Jun", v: 14 }];
const dept = [
  { name: "Engineering", value: 48 },
  { name: "Design", value: 14 },
  { name: "Sales", value: 22 },
  { name: "Finance", value: 9 },
  { name: "HR", value: 7 },
];
const COLORS = ["var(--color-chart-1)","var(--color-chart-2)","var(--color-chart-3)","var(--color-chart-4)","var(--color-chart-5)"];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <PageHeader title="HR Dashboard" subtitle="A pulse on your people operations." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total employees" value="248" delta="+12 this month" icon={<Users className="h-5 w-5" />} />
        <StatCard label="Present today"   value="218" delta="88% attendance" icon={<UserCheck className="h-5 w-5" />} tone="success" />
        <StatCard label="On leave"        value="14"  delta="6%" icon={<UserMinus className="h-5 w-5" />} tone="warning" />
        <StatCard label="Open roles"      value="9"   delta="3 closing soon" icon={<Briefcase className="h-5 w-5" />} tone="info" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Hiring trend</h3>
            <span className="flex items-center gap-1 text-sm text-success"><TrendingUp className="h-4 w-4" />+22%</span>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <BarChart data={hiring}>
                <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                <Bar dataKey="v" fill="var(--color-primary)" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6 shadow-soft">
          <h3 className="font-semibold">Department split</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={dept} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                  {dept.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
