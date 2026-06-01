import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, MapPin, CalendarDays, Wallet, Activity, CheckCircle2, Coffee } from "lucide-react";
import { useAppSelector } from "@/store";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area } from "recharts";
import { attendance, holidays, leaves, notifications, payslips } from "@/services/mock";
import { StatusBadge } from "@/components/common/StatusBadge";
import { toast } from "sonner";

export default function Dashboard() {
  const user = useAppSelector((s) => s.auth.user);
  const [checkedIn, setCheckedIn] = useState(false);
  const [time, setTime] = useState(new Date());
  const [loc, setLoc] = useState<string>("Detecting…");

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (!navigator.geolocation) { setLoc("Location unavailable"); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => setLoc(`${p.coords.latitude.toFixed(3)}, ${p.coords.longitude.toFixed(3)}`),
      () => setLoc("Location denied")
    );
  }, []);

  const chart = attendance.slice(0, 14).reverse().map((a) => ({ date: a.date.slice(5), hours: a.hoursWorked }));

  const onCheck = () => {
    setCheckedIn((v) => !v);
    toast.success(checkedIn ? "Checked out" : `Checked in @ ${loc}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0]} 👋`}
        subtitle="Here's a snapshot of your workspace today."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Hours this week" value="38h 12m" delta="+2h vs last week" icon={<Clock className="h-5 w-5" />} />
        <StatCard label="Leave balance"  value="14"      delta="of 24 days remaining" icon={<CalendarDays className="h-5 w-5" />} tone="info" />
        <StatCard label="Net salary"     value="₹82.5k"  delta="May 2026" icon={<Wallet className="h-5 w-5" />} tone="success" />
        <StatCard label="Tasks open"     value="6"       delta="2 due today" icon={<Activity className="h-5 w-5" />} tone="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-soft lg:col-span-1">
          <div className="absolute inset-0 -z-0 gradient-mesh opacity-60" />
          <div className="relative">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Today</p>
            <p className="mt-1 font-mono text-3xl font-bold">{time.toLocaleTimeString()}</p>
            <p className="text-sm text-muted-foreground">{time.toDateString()}</p>
            <div className="mt-4 flex items-center gap-2 rounded-xl border bg-background/60 p-3 text-sm backdrop-blur">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="truncate">{loc}</span>
            </div>
            <Button onClick={onCheck} className="mt-4 w-full" size="lg">
              {checkedIn ? <><Coffee className="mr-2 h-4 w-4" />Check Out</> : <><CheckCircle2 className="mr-2 h-4 w-4" />Check In</>}
            </Button>
          </div>
        </motion.div>

        <Card className="p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Working hours</p>
              <h3 className="text-lg font-semibold">Last 14 days</h3>
            </div>
            <span className="text-sm text-success">+8% trend</span>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer>
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="hours" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 shadow-soft">
          <h3 className="font-semibold">Upcoming Holidays</h3>
          <ul className="mt-4 space-y-3">
            {holidays.slice(0, 4).map((h) => (
              <li key={h.id} className="flex items-center justify-between rounded-xl border bg-background/50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{h.name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(h.date).toDateString()}</p>
                </div>
                <StatusBadge status={h.type} />
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6 shadow-soft">
          <h3 className="font-semibold">Recent Leave</h3>
          <ul className="mt-4 space-y-3">
            {leaves.slice(0, 4).map((l) => (
              <li key={l.id} className="flex items-center justify-between rounded-xl border bg-background/50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium capitalize">{l.type} leave</p>
                  <p className="text-xs text-muted-foreground">{l.from} → {l.to}</p>
                </div>
                <StatusBadge status={l.status} />
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6 shadow-soft">
          <h3 className="font-semibold">Notifications</h3>
          <ul className="mt-4 space-y-3">
            {notifications.slice(0, 4).map((n) => (
              <li key={n.id} className="rounded-xl border bg-background/50 px-3 py-2">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.body}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
