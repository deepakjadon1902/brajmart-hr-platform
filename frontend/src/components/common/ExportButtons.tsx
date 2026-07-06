import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

export function ExportButtons<T extends object>({
  rows,
  filename = "export",
}: {
  rows: T[];
  filename?: string;
}) {
  const exportPdf = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();
    const cols = rows.length ? Object.keys(rows[0]) : [];
    autoTable(doc, {
      head: [cols],
      body: rows.map((r) => {
        const row = r as Record<string, unknown>;
        return cols.map((c) => String(row[c] ?? ""));
      }),
    });
    doc.save(`${filename}.pdf`);
    toast.success("PDF exported");
  };
  const exportXlsx = async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(rows as Record<string, unknown>[]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
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
