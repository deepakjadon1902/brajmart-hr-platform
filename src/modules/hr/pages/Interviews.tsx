import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Calendar, Video } from "lucide-react";

const items = [
  { id: "i1", cand: "Ananya Kapoor", role: "Senior Frontend Engineer", when: "Today · 3:00 PM", mode: "Google Meet" },
  { id: "i2", cand: "Rohit Sharma", role: "Product Designer", when: "Tomorrow · 11:00 AM", mode: "On-site" },
  { id: "i3", cand: "Sara Khan", role: "Account Executive", when: "Fri · 2:30 PM", mode: "Zoom" },
];

export default function Interviews() {
  return (
    <div className="space-y-6">
      <PageHeader title="Interview Management" subtitle="Upcoming interviews and panels." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => (
          <Card key={i.id} className="p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Video className="h-5 w-5" /></div>
              <div><h3 className="font-semibold">{i.cand}</h3><p className="text-xs text-muted-foreground">{i.role}</p></div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" />{i.when}</div>
            <p className="mt-1 text-xs text-muted-foreground">via {i.mode}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
