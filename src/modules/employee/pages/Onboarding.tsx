import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check } from "lucide-react";

const steps = [
  { label: "Welcome", done: true },
  { label: "Submit Documents", done: true },
  { label: "Profile Completion", done: true },
  { label: "Policy Acceptance", done: false },
  { label: "Training", done: false },
];

export default function Onboarding() {
  const pct = Math.round((steps.filter((s) => s.done).length / steps.length) * 100);
  return (
    <div className="space-y-6">
      <PageHeader title="Onboarding" subtitle="Complete your onboarding journey." />
      <Card className="p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Your progress</h3>
          <span className="text-sm text-muted-foreground">{pct}%</span>
        </div>
        <Progress value={pct} className="mt-3" />
        <ul className="mt-6 space-y-3">
          {steps.map((s) => (
            <li key={s.label} className="flex items-center gap-3 rounded-xl border bg-background/50 px-4 py-3">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full ${s.done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}>
                {s.done ? <Check className="h-4 w-4" /> : <span className="text-xs">•</span>}
              </div>
              <span className={s.done ? "line-through text-muted-foreground" : "font-medium"}>{s.label}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
