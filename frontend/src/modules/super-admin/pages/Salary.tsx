import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { ExportButtons } from "@/components/common/ExportButtons";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store";
import { paySalary } from "@/store/slices/workspaceSlice";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";

export default function Salary() {
  const dispatch = useAppDispatch();
  const employees = useAppSelector((s) => s.workspace.employees);
  const month = new Date().toLocaleString("en", { month: "long", year: "numeric" });
  const rows = employees.map((employee) => ({
    id: employee.id,
    name: employee.name,
    email: employee.email,
    department: employee.department ?? "Unassigned",
    baseSalary: employee.baseSalary ?? employee.salary ?? 0,
    monthlyCtc: employee.monthlyCtc ?? employee.salary ?? 0,
    annualCtc: employee.annualCtc ?? (employee.salary ?? 0) * 12,
    bankAccount: employee.bankAccount ?? "Not added",
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salary"
        subtitle="Release salary, generate payslips and notify HR and employees."
      />
      <DataTable
        data={rows}
        searchKeys={["name", "email", "department", "bankAccount"]}
        toolbar={<ExportButtons rows={rows} filename="salary-register" />}
        columns={[
          { key: "name", header: "Employee" },
          { key: "department", header: "Department" },
          { key: "baseSalary", header: "Base", render: (row) => `INR ${row.baseSalary.toLocaleString()}` },
          { key: "monthlyCtc", header: "Monthly CTC", render: (row) => `INR ${row.monthlyCtc.toLocaleString()}` },
          { key: "annualCtc", header: "Annual CTC", render: (row) => `INR ${row.annualCtc.toLocaleString()}` },
          { key: "bankAccount", header: "Bank Account" },
          {
            key: "id",
            header: "Pay",
            render: (row) => (
              <Button
                size="sm"
                onClick={() => {
                  dispatch(paySalary({ employeeId: String(row.id), month }));
                  toast.success(`Salary released for ${row.name}`);
                }}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Pay
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}
