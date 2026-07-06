import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Award } from "lucide-react";
import { useAppSelector } from "@/store";

export default function Performance() {
  const employees = useAppSelector((s) => s.workspace.employees);

  return (
    <div className="space-y-6">
      <PageHeader title="Performance" subtitle="Track reviews and ratings across teams." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {employees.slice(0, 9).map((e, i) => {
          const score = 60 + ((i * 7) % 40);
          return (
            <Card key={e.id} className="p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{e.name}</p>
                  <p className="text-xs text-muted-foreground">{e.designation}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Score</span>
                  <span className="font-semibold">{score}/100</span>
                </div>
                <Progress value={score} className="mt-2" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
