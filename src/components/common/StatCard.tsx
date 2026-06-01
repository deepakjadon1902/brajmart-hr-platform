import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: ReactNode;
  delta?: string;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}

const TONES: Record<NonNullable<Props["tone"]>, string> = {
  default: "from-primary/10 to-primary/0 text-primary",
  success: "from-success/10 to-success/0 text-success",
  warning: "from-warning/15 to-warning/0 text-warning",
  danger:  "from-destructive/10 to-destructive/0 text-destructive",
  info:    "from-info/10 to-info/0 text-info",
};

export function StatCard({ label, value, delta, icon, tone = "default" }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-soft">
      <div className={cn("absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br opacity-70", TONES[tone])} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {delta && <p className="mt-1 text-xs text-muted-foreground">{delta}</p>}
        </div>
        {icon && <div className={cn("rounded-xl border bg-background/60 p-2.5 backdrop-blur", TONES[tone].split(" ").pop())}>{icon}</div>}
      </div>
    </motion.div>
  );
}
