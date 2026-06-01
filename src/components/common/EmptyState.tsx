import { ReactNode } from "react";
export function EmptyState({ icon, title, description, action }:
  { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-12 text-center">
      {icon && <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
