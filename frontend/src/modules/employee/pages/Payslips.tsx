import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ExportButtons } from "@/components/common/ExportButtons";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useAppSelector } from "@/store";

export default function Payslips() {
  const user = useAppSelector((s) => s.auth.user);
  const { payslips, employees } = useAppSelector((s) => s.workspace);
  const currentEmployee = employees.find((employee) => employee.id === user?.id) ?? employees[0];
  const employeePayslips = payslips.filter(
    (payslip) => !payslip.employeeId || payslip.employeeId === currentEmployee?.id,
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Payslips" subtitle="Download your monthly salary statements." />
      <DataTable
        data={employeePayslips}
        searchKeys={["month", "status"]}
        toolbar={<ExportButtons rows={employeePayslips} filename="payslips" />}
        columns={[
          { key: "month", header: "Month" },
          { key: "gross", header: "Gross", render: (r) => `₹${r.gross.toLocaleString()}` },
          {
            key: "deductions",
            header: "Deductions",
            render: (r) => `₹${r.deductions.toLocaleString()}`,
          },
          {
            key: "net",
            header: "Net Pay",
            render: (r) => <span className="font-semibold">₹{r.net.toLocaleString()}</span>,
          },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          {
            key: "id",
            header: "",
            render: () => (
              <Button size="sm" variant="ghost" onClick={() => toast.success("Download started")}>
                <Download className="mr-1 h-4 w-4" />
                PDF
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}
