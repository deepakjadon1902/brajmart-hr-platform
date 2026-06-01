import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card } from "@/components/ui/card";
import { Users, CalendarCheck, ClipboardList, Award } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { employees } from "@/services/mock";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/common/StatusBadge";

const data = [{d:"Mon",v:8},{d:"Tue",v:9},{d:"Wed",v:7},{d:"Thu",v:9},{d:"Fri",v:8}];
export default function D() {
  return (
    <div className="space-y-6">
      <PageHeader title="Team Dashboard" subtitle="Track your team's day-to-day at a glance." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Team size" value="12" icon={<Users className="h-5 w-5" />} />
        <StatCard label="Present today" value="10" tone="success" icon={<CalendarCheck className="h-5 w-5" />} />
        <StatCard label="Open tasks" value="18" tone="warning" icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard label="Avg rating" value="4.4" tone="info" icon={<Award className="h-5 w-5" />} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 shadow-soft lg:col-span-2">
          <h3 className="font-semibold">Team hours this week</h3>
          <div className="mt-4 h-64"><ResponsiveContainer>
            <BarChart data={data}><XAxis dataKey="d" stroke="var(--color-muted-foreground)" fontSize={11} /><YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background:"var(--color-card)", border:"1px solid var(--color-border)", borderRadius:12 }} />
              <Bar dataKey="v" fill="var(--color-primary)" radius={[8,8,0,0]} />
            </BarChart></ResponsiveContainer></div>
        </Card>
        <Card className="p-6 shadow-soft">
          <h3 className="font-semibold">My team</h3>
          <ul className="mt-4 space-y-3">
            {employees.slice(0,6).map((e) => (
              <li key={e.id} className="flex items-center gap-3">
                <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/10 text-xs text-primary">{e.name.split(" ").map(n=>n[0]).slice(0,2).join("")}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{e.name}</p><p className="truncate text-xs text-muted-foreground">{e.designation}</p></div>
                <StatusBadge status={e.status} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
