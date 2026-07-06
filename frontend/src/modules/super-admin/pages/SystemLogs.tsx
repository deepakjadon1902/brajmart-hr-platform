import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";

const lines: string[] = [];

export default function P() {
  return (
    <div className="space-y-6">
      <PageHeader title="System Logs" subtitle="Realtime platform logs." />
      <Card className="p-0 shadow-soft">
        <pre className="scrollbar-thin max-h-[60vh] overflow-auto rounded-2xl bg-slate-950 p-4 font-mono text-xs leading-6 text-emerald-300">
          {lines.length ? lines.join("\n") : "No system logs found in the database."}
        </pre>
      </Card>
    </div>
  );
}
