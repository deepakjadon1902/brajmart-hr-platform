import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { assets } from "@/services/mock";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Laptop, IdCard, Smartphone, Headphones, Monitor, Mouse } from "lucide-react";

const ICONS: Record<string, any> = { Laptop, "ID Card": IdCard, "SIM Card": Smartphone, Headset: Headphones, Monitor, Accessory: Mouse };

export default function Assets() {
  return (
    <div className="space-y-6">
      <PageHeader title="Assigned Assets" subtitle="Hardware and accessories issued to you." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assets.map((a) => {
          const Icon = ICONS[a.type] || Laptop;
          return (
            <Card key={a.id} className="p-5 shadow-soft">
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Icon className="h-5 w-5" /></div>
                <StatusBadge status={a.status} />
              </div>
              <h3 className="mt-4 font-semibold">{a.name}</h3>
              <p className="text-xs text-muted-foreground">{a.type}</p>
              {a.serial && <p className="mt-2 font-mono text-xs text-muted-foreground">SN: {a.serial}</p>}
              {a.assignedOn && <p className="text-xs text-muted-foreground">Assigned: {a.assignedOn}</p>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
