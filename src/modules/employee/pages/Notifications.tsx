import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { notifications } from "@/services/mock";
import { Bell } from "lucide-react";

export default function Notifications() {
  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" subtitle="Stay in the loop with the latest updates." />
      <div className="space-y-3">
        {notifications.map((n) => (
          <Card key={n.id} className="flex items-start gap-4 p-4 shadow-soft">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Bell className="h-5 w-5" /></div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium">{n.title}</p>
                <span className="text-xs text-muted-foreground">{n.time}</span>
              </div>
              <p className="text-sm text-muted-foreground">{n.body}</p>
            </div>
            {!n.read && <span className="mt-1 h-2 w-2 rounded-full bg-primary" />}
          </Card>
        ))}
      </div>
    </div>
  );
}
