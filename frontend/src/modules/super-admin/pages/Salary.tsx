import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { ExportButtons } from "@/components/common/ExportButtons";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/store";
import { paySalary } from "@/store/slices/workspaceSlice";
import type { Company, Employee, Payslip } from "@/types";
import {
  buildPayslipDefaults,
  downloadPayslipPdf,
  formatCurrency,
  normalizePayslip,
  PayslipTemplate,
} from "@/modules/payroll/payslip-template";
import { Download, Eye, Plus, ReceiptText } from "lucide-react";
import { toast } from "sonner";

function numberField(form: FormData, key: string) {
  return Number(form.get(key) || 0);
}

function activeCompany(companies: Company[], activeId: string) {
  return (
    companies.find((company) => company.id === activeId || company.companyId === activeId) ??
    companies[0]
  );
}

export default function Salary() {
  const dispatch = useAppDispatch();
  const employees = useAppSelector((s) => s.workspace.employees);
  const payslips = useAppSelector((s) => s.workspace.payslips);
  const companies = useAppSelector((s) => s.company.list);
  const activeCompanyId = useAppSelector((s) => s.company.activeId);
  const company = activeCompany(companies, activeCompanyId);
  const [open, setOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employees[0]?.id ?? "");
  const [preview, setPreview] = useState<Payslip | null>(null);
  const effectiveEmployeeId = selectedEmployeeId || employees[0]?.id || "";

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === effectiveEmployeeId) ?? employees[0],
    [employees, effectiveEmployeeId],
  );
  const defaults = useMemo(() => buildPayslipDefaults(selectedEmployee), [selectedEmployee]);
  const rows = employees.map((employee) => {
    const latestPayslip = payslips.find((payslip) => payslip.employeeId === employee.id);
    return {
      ...employee,
      latestMonth: latestPayslip?.month ?? "Not generated",
      latestNet: latestPayslip?.net ?? 0,
      latestStatus: latestPayslip?.status ?? "pending",
    };
  });

  const savePayslip = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const employeeId = String(
      form.get("employeeId") || effectiveEmployeeId || selectedEmployee?.id || "",
    );
    const employee = employees.find((item) => item.id === employeeId);
    if (!employee) {
      toast.error("Please select an employee");
      return;
    }

    const basicPay = numberField(form, "basicPay");
    const houseRentAllowance = numberField(form, "houseRentAllowance");
    const overtimeBonus = numberField(form, "overtimeBonus");
    const specialAllowance = numberField(form, "specialAllowance");
    const incomeTaxTds = numberField(form, "incomeTaxTds");
    const deductions = incomeTaxTds;
    const gross = basicPay + houseRentAllowance + overtimeBonus + specialAllowance;

    try {
      const created = await dispatch(
        paySalary({
          employeeId,
          month: String(form.get("month") || defaults.month),
          employeeNo: defaults.employeeNo,
          designation: defaults.designation,
          department: defaults.department,
          dateOfJoining: defaults.dateOfJoining,
          bankName: defaults.bankName,
          paidDays: numberField(form, "paidDays"),
          bankAccount: defaults.bankAccount,
          lopDays: numberField(form, "lopDays"),
          pan: defaults.pan,
          basicPay,
          houseRentAllowance,
          overtimeBonus,
          specialAllowance,
          incomeTaxTds,
          gross,
          deductions,
          net: Math.max(0, gross - deductions),
          status: "paid",
        }),
      ).unwrap();
      toast.success(`Payslip generated for ${employee.name}`);
      setPreview(created);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to generate payslip");
    }
  };

  const PayslipFields = ({ employee }: { employee?: Employee }) => {
    const fieldDefaults = buildPayslipDefaults(employee);
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Employee</Label>
          <Select
            name="employeeId"
            value={effectiveEmployeeId}
            onValueChange={setSelectedEmployeeId}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="month">Payslip month</Label>
          <Input
            id="month"
            name="month"
            defaultValue={fieldDefaults.month}
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="employeeNo">Employee No.</Label>
          <Input
            id="employeeNo"
            name="employeeNo"
            defaultValue={fieldDefaults.employeeNo}
            className="mt-1"
            readOnly
          />
        </div>
        <div>
          <Label htmlFor="designation">Designation</Label>
          <Input
            id="designation"
            name="designation"
            defaultValue={fieldDefaults.designation}
            className="mt-1"
            readOnly
          />
        </div>
        <div>
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            name="department"
            defaultValue={fieldDefaults.department}
            className="mt-1"
            readOnly
          />
        </div>
        <div>
          <Label htmlFor="dateOfJoining">Date of Joining</Label>
          <Input
            id="dateOfJoining"
            name="dateOfJoining"
            defaultValue={fieldDefaults.dateOfJoining}
            className="mt-1"
            readOnly
          />
        </div>
        <div>
          <Label htmlFor="bankName">Bank Name</Label>
          <Input
            id="bankName"
            name="bankName"
            defaultValue={fieldDefaults.bankName}
            className="mt-1"
            readOnly
          />
        </div>
        <div>
          <Label htmlFor="paidDays">Paid Days</Label>
          <Input
            id="paidDays"
            name="paidDays"
            type="number"
            step="0.5"
            defaultValue={fieldDefaults.paidDays}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="bankAccount">Bank Account</Label>
          <Input
            id="bankAccount"
            name="bankAccount"
            defaultValue={fieldDefaults.bankAccount}
            className="mt-1"
            readOnly
          />
        </div>
        <div>
          <Label htmlFor="lopDays">LOP Days</Label>
          <Input
            id="lopDays"
            name="lopDays"
            type="number"
            step="0.5"
            defaultValue={fieldDefaults.lopDays}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="pan">PAN</Label>
          <Input id="pan" name="pan" defaultValue={fieldDefaults.pan} className="mt-1" readOnly />
        </div>
        <div>
          <Label htmlFor="basicPay">Basic Pay</Label>
          <Input
            id="basicPay"
            name="basicPay"
            type="number"
            defaultValue={fieldDefaults.basicPay}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="houseRentAllowance">House Rent Allowance</Label>
          <Input
            id="houseRentAllowance"
            name="houseRentAllowance"
            type="number"
            defaultValue={fieldDefaults.houseRentAllowance}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="overtimeBonus">Overtime Bonus</Label>
          <Input
            id="overtimeBonus"
            name="overtimeBonus"
            type="number"
            defaultValue={0}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="specialAllowance">Special Allowance</Label>
          <Input
            id="specialAllowance"
            name="specialAllowance"
            type="number"
            defaultValue={0}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="incomeTaxTds">Income Tax (TDS)</Label>
          <Input
            id="incomeTaxTds"
            name="incomeTaxTds"
            type="number"
            defaultValue={0}
            className="mt-1"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salary"
        subtitle="Create official BrajMart payslips and export them as PDF documents."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Generate payslip
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Generate payslip</DialogTitle>
              </DialogHeader>
              <form key={selectedEmployee?.id} className="space-y-4" onSubmit={savePayslip}>
                <PayslipFields employee={selectedEmployee} />
                <Button type="submit" className="w-full" disabled={!selectedEmployee}>
                  <ReceiptText className="mr-2 h-4 w-4" />
                  Save official payslip
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Dialog open={Boolean(preview)} onOpenChange={(value) => !value && setPreview(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Payslip preview</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-4">
              <PayslipTemplate
                payslip={preview}
                employee={employees.find((employee) => employee.id === preview.employeeId)}
                company={company}
              />
              <div className="flex flex-wrap justify-end gap-2">
                <Button onClick={() => downloadPayslipPdf(preview, undefined, company)}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DataTable
        data={rows}
        searchKeys={[
          "name",
          "email",
          "employeeNo",
          "department",
          "designation",
          "bankName",
          "bankAccount",
          "pan",
        ]}
        toolbar={<ExportButtons rows={rows} filename="salary-register" />}
        columns={[
          { key: "name", header: "Employee" },
          { key: "employeeNo", header: "Employee No." },
          { key: "department", header: "Department" },
          { key: "designation", header: "Designation" },
          {
            key: "monthlyCtc",
            header: "Monthly CTC",
            render: (row) => formatCurrency(row.monthlyCtc ?? row.salary ?? 0),
          },
          { key: "bankName", header: "Bank" },
          { key: "latestMonth", header: "Latest Payslip" },
          {
            key: "id",
            header: "Create",
            render: (row) => (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedEmployeeId(row.id);
                  setOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Payslip
              </Button>
            ),
          },
        ]}
      />

      <DataTable
        data={payslips}
        searchKeys={["employeeName", "month", "status"]}
        emptyMessage="No payslips generated yet"
        columns={[
          { key: "employeeName", header: "Employee" },
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
            render: (row) => {
              const employee = employees.find((item) => item.id === row.employeeId);
              const fullPayslip = normalizePayslip(row, employee);
              return (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPreview(fullPayslip)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => downloadPayslipPdf(fullPayslip, employee, company)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                </div>
              );
            },
          },
        ]}
      />
    </div>
  );
}
