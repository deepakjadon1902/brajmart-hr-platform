import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
const lines = [
  "[INFO] 2026-06-01 09:12:01 boot ok",
  "[INFO] 2026-06-01 09:12:02 db connected",
  "[WARN] 2026-06-01 09:14:11 high latency on /api/leaves",
  "[INFO] 2026-06-01 09:15:00 cache primed",
  "[ERROR] 2026-06-01 09:16:42 mail-worker retry 1",
  "[INFO] 2026-06-01 09:17:00 mail-worker recovered",
];
export default function P() {
  return (
    <div className="space-y-6">
      <PageHeader title="System Logs" subtitle="Realtime platform logs." />
      <Card className="p-0 shadow-soft">
        <pre className="scrollbar-thin max-h-[60vh] overflow-auto rounded-2xl bg-slate-950 p-4 font-mono text-xs leading-6 text-emerald-300">
          {lines.join("\n")}
        </pre>
      </Card>
    </div>
  );
}
