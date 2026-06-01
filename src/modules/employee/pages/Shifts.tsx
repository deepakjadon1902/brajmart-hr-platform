import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { shifts } from "@/services/mock";
import { Sun, Sunset, Moon, Workflow } from "lucide-react";

const ICONS: Record<string, any> = { Morning: Sun, Evening: Sunset, Night: Moon, Custom: Workflow };

export default function Shifts() {
  return (
    <div className="space-y-6">
      <PageHeader title="Shift Schedule" subtitle="View your assigned shifts and rotations." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {shifts.map((s) => {
          const Icon = ICONS[s.name] || Workflow;
          return (
            <Card key={s.id} className="p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Icon className="h-5 w-5" /></div>
                <span className="text-xs text-muted-foreground">{s.employees} employees</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{s.name} Shift</h3>
              <p className="text-sm text-muted-foreground">{s.start} – {s.end}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
