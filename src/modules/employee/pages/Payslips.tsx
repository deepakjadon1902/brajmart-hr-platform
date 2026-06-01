import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ExportButtons } from "@/components/common/ExportButtons";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { payslips } from "@/services/mock";
import { toast } from "sonner";

export default function Payslips() {
  return (
    <div className="space-y-6">
      <PageHeader title="Payslips" subtitle="Download your monthly salary statements." />
      <DataTable
        data={payslips}
        searchKeys={["month", "status"]}
        toolbar={<ExportButtons rows={payslips} filename="payslips" />}
        columns={[
          { key: "month", header: "Month" },
          { key: "gross", header: "Gross", render: (r) => `₹${r.gross.toLocaleString()}` },
          { key: "deductions", header: "Deductions", render: (r) => `₹${r.deductions.toLocaleString()}` },
          { key: "net", header: "Net Pay", render: (r) => <span className="font-semibold">₹{r.net.toLocaleString()}</span> },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "id", header: "", render: () => (
            <Button size="sm" variant="ghost" onClick={() => toast.success("Download started")}>
              <Download className="mr-1 h-4 w-4" />PDF
            </Button>
          ) },
        ]}
      />
    </div>
  );
}
