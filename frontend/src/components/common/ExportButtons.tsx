import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

type ExportColumn<T extends object> = {
  key: string;
  header: string;
  value: (row: T, index: number) => string | number;
};

const hiddenKeys = new Set([
  "id",
  "_id",
  "avatar",
  "password",
  "companyId",
  "createdAt",
  "updatedAt",
  "assignedById",
  "employeeId",
  "clientId",
  "template",
  "notes",
]);

const labels: Record<string, string> = {
  annualCtc: "Annual CTC",
  appliedOn: "Applied On",
  bankAccount: "Bank Account",
  baseSalary: "Base Salary",
  checkIn: "Check In",
  checkOut: "Check Out",
  clientName: "Client",
  department: "Department",
  deductions: "Deductions",
  domain: "Domain",
  email: "Email",
  employeeName: "Employee",
  from: "From",
  gross: "Gross",
  hours: "Hours",
  hoursWorked: "Hours",
  joinDate: "Joining Date",
  lastUpdated: "Last Updated",
  monthlyCtc: "Monthly CTC",
  monthlyValue: "Monthly Value",
  name: "Name",
  net: "Net Pay",
  owner: "Owner",
  paidOn: "Paid On",
  reason: "Reason",
  status: "Status",
  tax: "Tax",
  to: "To",
  total: "Total",
  type: "Type",
  updatedOn: "Updated On",
};

const presets: Record<string, string[]> = {
  employees: [
    "name",
    "email",
    "role",
    "department",
    "designation",
    "phone",
    "location",
    "manager",
    "joinDate",
    "status",
  ],
  attendance: [
    "name",
    "employeeName",
    "dept",
    "department",
    "date",
    "checkIn",
    "checkOut",
    "hours",
    "hoursWorked",
    "status",
  ],
  payslips: ["employeeName", "month", "gross", "deductions", "net", "status", "paidOn"],
  "salary-register": [
    "name",
    "email",
    "department",
    "baseSalary",
    "monthlyCtc",
    "annualCtc",
    "bankAccount",
  ],
  "digital-marketing-clients": [
    "name",
    "owner",
    "email",
    "domain",
    "monthlyValue",
    "status",
    "addedBy",
    "lastUpdated",
  ],
  "digital-marketing-invoices": [
    "clientName",
    "domain",
    "month",
    "amount",
    "tax",
    "total",
    "status",
    "updatedOn",
  ],
  monthly_attendance: ["name", "email", "department", "designation", "status", "joinDate"],
  leave_summary: ["name", "email", "department", "designation", "status", "joinDate"],
  payroll_register: [
    "name",
    "email",
    "department",
    "baseSalary",
    "monthlyCtc",
    "annualCtc",
    "bankAccount",
  ],
  headcount_report: ["name", "email", "department", "designation", "status", "joinDate"],
};

function titleCase(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") return value.toLocaleString("en-IN");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) return value.toLocaleDateString("en-IN");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).replace(/\s+/g, " ").trim();
}

function resolveColumns<T extends object>(rows: T[], filename: string): ExportColumn<T>[] {
  const firstRow = (rows[0] ?? {}) as Record<string, unknown>;
  const presetKeys = presets[filename] ?? presets[filename.toLowerCase()];
  const keys = (presetKeys ?? Object.keys(firstRow)).filter(
    (key) => key in firstRow && !hiddenKeys.has(key),
  );

  return keys.map((key) => ({
    key,
    header: labels[key] ?? titleCase(key),
    value: (row) => formatValue((row as Record<string, unknown>)[key]),
  }));
}

function reportTitle(filename: string) {
  return titleCase(filename.replace(/\.[a-z]+$/i, ""));
}

export function ExportButtons<T extends object>({
  rows,
  filename = "export",
}: {
  rows: T[];
  filename?: string;
}) {
  const exportPdf = async () => {
    if (!rows.length) {
      toast.error("No records to export");
      return;
    }
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const columns = resolveColumns(rows, filename);
    const doc = new jsPDF({
      orientation: columns.length > 6 ? "landscape" : "portrait",
      unit: "pt",
      format: "a4",
    });
    const title = reportTitle(filename);
    const generatedAt = new Date().toLocaleString("en-IN");
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 74, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("BrajMart EcomTech LLP", 40, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`${title} | Generated ${generatedAt}`, 40, 50);

    autoTable(doc, {
      startY: 96,
      head: [columns.map((column) => column.header)],
      body: rows.map((row, index) => columns.map((column) => column.value(row, index))),
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 5,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 96, right: 32, bottom: 42, left: 32 },
      didDrawPage: () => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
          `Page ${doc.getCurrentPageInfo().pageNumber} of ${pageCount}`,
          pageWidth - 84,
          doc.internal.pageSize.getHeight() - 20,
        );
      },
    });
    doc.save(`${filename}.pdf`);
    toast.success("PDF exported");
  };
  const exportXlsx = async () => {
    if (!rows.length) {
      toast.error("No records to export");
      return;
    }
    const XLSX = await import("xlsx");
    const columns = resolveColumns(rows, filename);
    const exportRows = rows.map((row, index) =>
      Object.fromEntries(columns.map((column) => [column.header, column.value(row, index)])),
    );
    const ws = XLSX.utils.json_to_sheet(exportRows);
    ws["!cols"] = columns.map((column) => ({
      wch: Math.min(Math.max(column.header.length + 6, 14), 32),
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, reportTitle(filename).slice(0, 31));
    XLSX.writeFile(wb, `${filename}.xlsx`);
    toast.success("Excel exported");
  };
  return (
    <>
      <Button variant="outline" size="sm" onClick={exportPdf}>
        <FileDown className="mr-2 h-4 w-4" />
        PDF
      </Button>
      <Button variant="outline" size="sm" onClick={exportXlsx}>
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Excel
      </Button>
    </>
  );
}
