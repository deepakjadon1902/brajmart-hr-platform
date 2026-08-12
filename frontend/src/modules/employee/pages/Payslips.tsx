import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppSelector } from "@/store";
import type { Payslip } from "@/types";
import {
  downloadPayslipDoc,
  downloadPayslipPdf,
  formatCurrency,
  normalizePayslip,
  PayslipTemplate,
} from "@/modules/payroll/payslip-template";
import { Download, Eye, FileText } from "lucide-react";

export default function Payslips() {
  const user = useAppSelector((s) => s.auth.user);
  const { payslips, employees } = useAppSelector((s) => s.workspace);
  const companies = useAppSelector((s) => s.company.list);
  const activeCompanyId = useAppSelector((s) => s.company.activeId);
  const company =
    companies.find((item) => item.id === activeCompanyId || item.companyId === activeCompanyId) ??
    companies[0];
  const currentEmployee = employees.find((employee) => employee.id === user?.id) ?? user;
  const employeePayslips = payslips
    .filter((payslip) => payslip.employeeId === currentEmployee?.id)
    .map((payslip) => normalizePayslip(payslip, currentEmployee));
  const [preview, setPreview] = useState<Payslip | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payslips"
        subtitle="Preview and download your monthly salary statements."
      />

      <Dialog open={Boolean(preview)} onOpenChange={(value) => !value && setPreview(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Payslip preview</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-4">
              <PayslipTemplate payslip={preview} employee={currentEmployee} company={company} />
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => downloadPayslipDoc(preview, currentEmployee, company)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  DOC
                </Button>
                <Button onClick={() => downloadPayslipPdf(preview, currentEmployee, company)}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DataTable
        data={employeePayslips}
        searchKeys={["month", "status"]}
        columns={[
          { key: "month", header: "Month" },
          { key: "gross", header: "Gross", render: (row) => formatCurrency(row.gross) },
          {
            key: "deductions",
            header: "Deductions",
            render: (row) => formatCurrency(row.deductions),
          },
          {
            key: "net",
            header: "Net Pay",
            render: (row) => <span className="font-semibold">{formatCurrency(row.net)}</span>,
          },
          { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
          {
            key: "id",
            header: "Download",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setPreview(row)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => downloadPayslipDoc(row, currentEmployee, company)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  DOC
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => downloadPayslipPdf(row, currentEmployee, company)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
