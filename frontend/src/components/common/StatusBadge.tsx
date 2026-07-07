import { cn } from "@/lib/utils";

const MAP: Record<string, string> = {
  active: "bg-success/15 text-success",
  present: "bg-success/15 text-success",
  approved: "bg-success/15 text-success",
  paid: "bg-success/15 text-success",
  continue: "bg-success/15 text-success",
  assigned: "bg-info/15 text-info",
  "not-started": "bg-muted text-muted-foreground",
  "in-progress": "bg-warning/15 text-warning",
  completed: "bg-success/15 text-success",
  low: "bg-muted text-muted-foreground",
  medium: "bg-info/15 text-info",
  high: "bg-destructive/15 text-destructive",
  sent: "bg-info/15 text-info",
  pending: "bg-warning/15 text-warning",
  draft: "bg-warning/15 text-warning",
  new: "bg-info/15 text-info",
  late: "bg-warning/15 text-warning",
  "half-day": "bg-warning/15 text-warning",
  "on-leave": "bg-info/15 text-info",
  "on-break": "bg-warning/15 text-warning",
  leave: "bg-destructive/15 text-destructive",
  rejected: "bg-destructive/15 text-destructive",
  absent: "bg-destructive/15 text-destructive",
  inactive: "bg-muted text-muted-foreground",
  returned: "bg-muted text-muted-foreground",
  "in-repair": "bg-warning/15 text-warning",
};

export function StatusBadge({ status }: { status: string }) {
  const key = String(status).toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        MAP[key] || "bg-muted text-muted-foreground",
      )}
    >
      {status.replace("-", " ")}
    </span>
  );
}
