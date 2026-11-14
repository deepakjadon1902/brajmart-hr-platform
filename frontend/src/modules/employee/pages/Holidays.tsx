import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card } from "@/components/ui/card";
import { useAppSelector } from "@/store";
import { todayInIndia } from "@/utils/date";

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Holidays() {
  const holidays = useAppSelector((state) => state.workspace.holidays);
  const today = todayInIndia();
  const upcoming = holidays
    .filter((holiday) => holiday.date >= today)
    .sort((first, second) => first.date.localeCompare(second.date));
  const past = holidays
    .filter((holiday) => holiday.date < today)
    .sort((first, second) => second.date.localeCompare(first.date));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Holiday Calendar"
        subtitle="Company holidays shared by HR for your workplace."
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Upcoming holidays</h2>
            <p className="text-sm text-muted-foreground">{upcoming.length} scheduled</p>
          </div>
        </div>
        {upcoming.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {upcoming.map((holiday) => (
              <HolidayCard key={holiday.id} name={holiday.name} date={holiday.date} type={holiday.type} />
            ))}
          </div>
        ) : (
          <Card className="flex items-center gap-3 border-dashed p-5 shadow-none">
            <CalendarDays className="h-5 w-5 text-slate-400" />
            <p className="text-sm text-muted-foreground">No upcoming holidays have been published yet.</p>
          </Card>
        )}
      </section>

      {past.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Previous holidays</h2>
            <p className="text-sm text-muted-foreground">Recent dates remain available for reference.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {past.map((holiday) => (
              <HolidayCard key={holiday.id} name={holiday.name} date={holiday.date} type={holiday.type} past />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function HolidayCard({
  name,
  date,
  type,
  past = false,
}: {
  name: string;
  date: string;
  type: string;
  past?: boolean;
}) {
  const [year, month, day] = date.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);

  return (
    <Card className={`overflow-hidden p-0 shadow-none ${past ? "opacity-75" : ""}`}>
      <div className="flex items-center gap-4 border-b border-slate-100 p-4">
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 text-blue-800">
          <span className="text-[10px] font-semibold uppercase tracking-wide">
            {localDate.toLocaleString("en-IN", { month: "short" })}
          </span>
          <span className="text-xl font-semibold tabular-nums">{day}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-900">{name}</h3>
          <p className="mt-1 text-sm text-slate-500">{formatDate(date)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <CalendarDays className="h-3.5 w-3.5" />
          {past ? "Past holiday" : "Company calendar"}
        </span>
        <StatusBadge status={type} />
      </div>
    </Card>
  );
}
