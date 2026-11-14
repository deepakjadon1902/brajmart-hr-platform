import type { ReactNode } from "react";
import { CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";

const metricTones = {
  blue: "border-blue-100 bg-blue-50 text-blue-700",
  green: "border-emerald-100 bg-emerald-50 text-emerald-700",
  amber: "border-amber-100 bg-amber-50 text-amber-700",
  red: "border-rose-100 bg-rose-50 text-rose-700",
  violet: "border-violet-100 bg-violet-50 text-violet-700",
  cyan: "border-cyan-100 bg-cyan-50 text-cyan-700",
} as const;

type MetricTone = keyof typeof metricTones;

export function DashboardHero({
  eyebrow,
  title,
  description,
  date,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  date: string;
  actions?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl bg-slate-950 px-6 py-6 text-white shadow-sm md:flex-row md:items-center md:justify-between md:px-8">
      <div className="max-w-2xl border-l-2 border-sky-400 pl-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">{description}</p>
      </div>
      <div className="flex flex-col gap-3 md:items-end">
        <div className="inline-flex items-center gap-2 text-sm text-slate-300">
          <CalendarDays className="h-4 w-4 text-sky-300" />
          <span>{date}</span>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </section>
  );
}

export function DashboardMetric({
  label,
  value,
  note,
  icon,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  note: string;
  icon: ReactNode;
  tone?: MetricTone;
}) {
  return (
    <Card className="rounded-2xl border-slate-200 p-5 shadow-none transition-colors hover:border-slate-300">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <span className={`rounded-lg border p-2 ${metricTones[tone]}`}>{icon}</span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{note}</p>
    </Card>
  );
}

export function DashboardPanel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`rounded-2xl border-slate-200 p-5 shadow-none ${className}`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function DashboardProgress({
  label,
  value,
  total,
  tone = "blue",
  detail,
}: {
  label: string;
  value: number;
  total: number;
  tone?: MetricTone;
  detail?: string;
}) {
  const percent = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  const barTones: Record<MetricTone, string> = {
    blue: "bg-blue-700",
    green: "bg-emerald-600",
    amber: "bg-amber-500",
    red: "bg-rose-600",
    violet: "bg-violet-600",
    cyan: "bg-cyan-600",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="shrink-0 tabular-nums text-slate-600">
          <span className="font-semibold text-slate-900">{value}</span>
          {detail ? <span className="ml-2 text-xs text-slate-500">{detail}</span> : null}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={Math.max(total, 1)}
      >
        <div className={`h-full rounded-full transition-all ${barTones[tone]}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
