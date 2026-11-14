import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/store";
import { rehireEmployee, separateEmployee } from "@/store/slices/workspaceSlice";
import type { AttendanceRecord, Employee } from "@/types";
import { toast } from "sonner";

function todayInput() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-IN");
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("en-IN");
}

function employeeRecords<T extends { employeeId?: string }>(records: T[], employee: Employee) {
  return records.filter((record) => record.employeeId === employee.id);
}

export default function Exit() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedEmployeeId = searchParams.get("employeeId");
  const currentUserId = useAppSelector((state) => state.auth.user?.id);
  const { employees, attendance, leaves, payslips, assets, documents, tasks } = useAppSelector(
    (state) => state.workspace,
  );
  const [exiting, setExiting] = useState<Employee | null>(null);
  const [viewing, setViewing] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!requestedEmployeeId) return;
    const employee = employees.find((item) => item.id === requestedEmployeeId);
    if (
      !employee ||
      employee.id === currentUserId ||
      employee.role === "super-admin" ||
      employee.status === "inactive" ||
      employee.exitDate
    ) {
      return;
    }
    setExiting(employee);
    navigate("/hr/exit", { replace: true });
  }, [currentUserId, employees, navigate, requestedEmployeeId]);

  const activeEmployees = useMemo(
    () =>
      employees.filter(
        (employee) =>
          employee.id !== currentUserId &&
          employee.role !== "super-admin" &&
          employee.status !== "inactive" &&
          !employee.exitDate,
      ),
    [currentUserId, employees],
  );
  const pastEmployees = useMemo(
    () =>
      employees
        .filter((employee) => employee.status === "inactive" && Boolean(employee.exitDate))
        .sort((first, second) =>
          String(second.exitDate).localeCompare(String(first.exitDate)),
        ),
    [employees],
  );

  const processExit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!exiting) return;
    const form = new FormData(event.currentTarget);
    const lastWorkingDay = String(form.get("lastWorkingDay") ?? "");
    const exitDate = String(form.get("exitDate") ?? "");
    if (!lastWorkingDay || !exitDate) {
      toast.error("Enter both the last working day and exit date");
      return;
    }
    if (exitDate < lastWorkingDay) {
      toast.error("Exit date must be on or after the last working day");
      return;
    }
    if (lastWorkingDay > todayInput() || exitDate > todayInput()) {
      toast.error("Use the actual last working and exit dates. Future exits cannot be processed here.");
      return;
    }

    setSaving(true);
    try {
      const separatedEmployee = await dispatch(
        separateEmployee({ id: exiting.id, lastWorkingDay, exitDate }),
      ).unwrap();
      toast.success(`${exiting.name} moved to Past Employees`);
      setExiting(null);
      setViewing(separatedEmployee);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to process employee exit");
    } finally {
      setSaving(false);
    }
  };

  const rehire = async (employee: Employee) => {
    setSaving(true);
    try {
      await dispatch(rehireEmployee(employee.id)).unwrap();
      toast.success(`${employee.name} rehired and moved to active employees`);
      setViewing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to rehire employee");
    } finally {
      setSaving(false);
    }
  };

  const selectedRecords = viewing
    ? {
        attendance: employeeRecords(attendance, viewing).sort((a, b) => b.date.localeCompare(a.date)),
        leaves: employeeRecords(leaves, viewing),
        payslips: employeeRecords(payslips, viewing),
        assets: employeeRecords(assets, viewing),
        documents: employeeRecords(documents, viewing),
        tasks: employeeRecords(tasks, viewing),
      }
    : null;

  const attendanceRows = (selectedRecords?.attendance ?? []).map((record: AttendanceRecord) => ({
    ...record,
    checkIn: record.checkIn ?? "-",
    checkOut: record.checkOut ?? "-",
    hoursWorked: record.hoursWorked ?? 0,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Employee Exit / Separation"
        subtitle="Record employee exits while keeping their profile and HR history available."
      />

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Current employees</h2>
          <p className="text-sm text-muted-foreground">
            Process an exit to deactivate portal access and retain the employee record.
          </p>
        </div>
        <DataTable
          data={activeEmployees}
          searchKeys={["name", "email", "employeeNo", "department", "designation"]}
          emptyMessage="No current employees found"
          columns={[
            { key: "name", header: "Employee" },
            { key: "employeeNo", header: "Employee No." },
            { key: "department", header: "Department" },
            { key: "designation", header: "Designation" },
            { key: "joinDate", header: "Date of joining", render: (employee) => formatDate(employee.joinDate) },
            { key: "status", header: "Status", render: (employee) => <StatusBadge status={employee.status} /> },
            {
              key: "id",
              header: "Action",
              render: (employee) => (
                <div className="flex flex-wrap gap-2">
                  {employee.separations?.length ? (
                    <Button size="sm" variant="ghost" onClick={() => setViewing(employee)}>
                      View prior history
                    </Button>
                  ) : null}
                  <Button size="sm" variant="outline" onClick={() => setExiting(employee)}>
                    Process exit
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Past Employees</h2>
          <p className="text-sm text-muted-foreground">
            Separated employees remain available here with their employment and attendance history.
          </p>
        </div>
        <DataTable
          data={pastEmployees}
          searchKeys={["name", "email", "employeeNo", "department", "designation"]}
          emptyMessage="No past employees"
          columns={[
            { key: "name", header: "Employee" },
            { key: "employeeNo", header: "Employee No." },
            { key: "department", header: "Department" },
            { key: "designation", header: "Designation" },
            { key: "lastWorkingDay", header: "Last working day", render: (employee) => formatDate(employee.lastWorkingDay) },
            { key: "exitDate", header: "Exit date", render: (employee) => formatDate(employee.exitDate) },
            {
              key: "separations",
              header: "Recorded on",
              render: (employee) =>
                formatDateTime(employee.separations?.[employee.separations.length - 1]?.recordedAt),
            },
            {
              key: "id",
              header: "Records",
              render: (employee) => (
                <Button size="sm" variant="outline" onClick={() => setViewing(employee)}>
                  View employment history
                </Button>
              ),
            },
          ]}
        />
      </section>

      <Dialog open={Boolean(exiting)} onOpenChange={(open) => !open && setExiting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process employee exit</DialogTitle>
            <DialogDescription>
              {exiting?.name} will be marked inactive and moved to Past Employees. Their employee
              profile and linked HR records will be retained. Enter the actual dates, even if the
              employee left before today; the system records when HR saves this exit separately.
            </DialogDescription>
          </DialogHeader>
          {exiting && (
            <form className="space-y-4" onSubmit={processExit}>
              <div>
                <Label htmlFor="lastWorkingDay">Last working day</Label>
                <Input
                  id="lastWorkingDay"
                  name="lastWorkingDay"
                  type="date"
                  max={todayInput()}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="exitDate">Exit date (effective)</Label>
                <Input
                  id="exitDate"
                  name="exitDate"
                  type="date"
                  max={todayInput()}
                  className="mt-1"
                  required
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Recorded on is set automatically when you save. The last working day and effective
                exit date can both be entered as past dates. For example, if the employee left 10
                days ago, enter that date; Recorded on will show today.
              </p>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setExiting(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Confirm exit"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{viewing?.name} employment history</DialogTitle>
            <DialogDescription>
              The employee profile remains linked to records created during their employment.
            </DialogDescription>
          </DialogHeader>
          {viewing && selectedRecords && (
            <div className="space-y-6">
              <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3">
                <HistoryField label="Employee number" value={viewing.employeeNo} />
                <HistoryField label="Email" value={viewing.email} />
                <HistoryField label="Date of joining" value={formatDate(viewing.joinDate)} />
                <HistoryField label="Department" value={viewing.department} />
                <HistoryField label="Designation" value={viewing.designation} />
                <HistoryField label="Manager" value={viewing.manager} />
                <HistoryField label="Last working day" value={formatDate(viewing.lastWorkingDay)} />
                <HistoryField label="Exit date" value={formatDate(viewing.exitDate)} />
                <HistoryField
                  label="Status"
                  value={viewing.exitDate ? "Exited" : viewing.status === "on-leave" ? "On leave" : "Active"}
                />
                <HistoryField
                  label="Latest exit recorded on"
                  value={formatDateTime(
                    viewing.separations?.[viewing.separations.length - 1]?.recordedAt,
                  )}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <RecordCount label="Attendance" count={selectedRecords.attendance.length} />
                <RecordCount label="Leave" count={selectedRecords.leaves.length} />
                <RecordCount label="Payslips" count={selectedRecords.payslips.length} />
                <RecordCount label="Assets" count={selectedRecords.assets.length} />
                <RecordCount label="Documents" count={selectedRecords.documents.length} />
                <RecordCount label="Tasks" count={selectedRecords.tasks.length} />
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Separation history</h3>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Last working day</th>
                        <th className="px-4 py-3 text-left font-medium">Exit date</th>
                        <th className="px-4 py-3 text-left font-medium">Recorded by</th>
                        <th className="px-4 py-3 text-left font-medium">Recorded on</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(viewing.separations ?? []).map((separation, index) => (
                        <tr key={`${separation.exitDate}-${index}`} className="border-t">
                          <td className="px-4 py-3">{formatDate(separation.lastWorkingDay)}</td>
                          <td className="px-4 py-3">{formatDate(separation.exitDate)}</td>
                          <td className="px-4 py-3">{separation.recordedByName || "-"}</td>
                          <td className="px-4 py-3">{formatDateTime(separation.recordedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Attendance history</h3>
                <DataTable
                  data={attendanceRows}
                  pageSize={6}
                  searchKeys={["date", "checkIn", "checkOut", "status"]}
                  emptyMessage="No attendance records are linked to this profile"
                  columns={[
                    { key: "date", header: "Date" },
                    { key: "checkIn", header: "Check in" },
                    { key: "checkOut", header: "Check out" },
                    { key: "hoursWorked", header: "Hours" },
                    { key: "status", header: "Status", render: (record) => <StatusBadge status={record.status} /> },
                  ]}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setViewing(null)}>
                  Close
                </Button>
                {viewing.exitDate && (
                  <Button onClick={() => void rehire(viewing)} disabled={saving}>
                    Rehire employee
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HistoryField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value || "-"}</p>
    </div>
  );
}

function RecordCount({ label, count }: { label: string; count: number }) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{count}</p>
    </div>
  );
}
