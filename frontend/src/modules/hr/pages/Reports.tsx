import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { ExportButtons } from "@/components/common/ExportButtons";
import { FileText } from "lucide-react";
import { useAppSelector } from "@/store";

const reports = [
  { id: "r1", name: "Monthly Attendance", desc: "Detailed attendance per employee." },
  { id: "r2", name: "Leave Summary", desc: "Approved & pending leaves." },
  { id: "r3", name: "Payroll Register", desc: "Salary breakdown and deductions." },
  { id: "r4", name: "Headcount Report", desc: "Department-wise headcount." },
];

export default function Reports() {
  const employees = useAppSelector((s) => s.workspace.employees);

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Generate and export operational reports." />
      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((r) => (
          <Card key={r.id} className="flex items-center justify-between p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{r.name}</h3>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <ExportButtons
                rows={employees}
                filename={r.name.replace(/\s+/g, "_").toLowerCase()}
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
