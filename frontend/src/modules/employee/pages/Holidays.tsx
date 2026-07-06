import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CalendarDays } from "lucide-react";
import { useAppSelector } from "@/store";

export default function Holidays() {
  const holidays = useAppSelector((s) => s.workspace.holidays);

  return (
    <div className="space-y-6">
      <PageHeader title="Holiday Calendar" subtitle="Public, company and department holidays." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {holidays.map((h) => (
          <Card
            key={h.id}
            className="overflow-hidden p-0 shadow-soft transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4 border-b bg-gradient-to-br from-primary/10 to-transparent p-4">
              <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-card shadow-soft">
                <span className="text-[10px] uppercase text-muted-foreground">
                  {new Date(h.date).toLocaleString("en", { month: "short" })}
                </span>
                <span className="text-xl font-bold">{new Date(h.date).getDate()}</span>
              </div>
              <div>
                <h3 className="font-semibold">{h.name}</h3>
                <p className="text-xs text-muted-foreground">{new Date(h.date).toDateString()}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="flex items-center text-xs text-muted-foreground">
                <CalendarDays className="mr-1 h-3.5 w-3.5" />
                Holiday
              </span>
              <StatusBadge status={h.type} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
