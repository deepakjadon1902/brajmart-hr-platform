import { useState } from "react";
import type { FormEvent } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { ExportButtons } from "@/components/common/ExportButtons";
import { PasswordInput } from "@/components/common/PasswordInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ExternalLink, FileText, LogOut, Pencil, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  createEmployee,
  fetchEmployees,
  fetchWorkspace,
  updateDocumentStatus,
  updateEmployee,
} from "@/store/slices/workspaceSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Company, Employee, Role } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const roleOptions: Array<{ value: Role; label: string }> = [
  { value: "employee", label: "Employee" },
  { value: "hr", label: "HR" },
  { value: "team-manager", label: "Team Manager" },
  { value: "digital-marketing", label: "Digital Marketing" },
];

function inferRoleFromDetails(department: string, designation: string): Role {
  return /\bhr\b|human resources/i.test(`${department} ${designation}`) ? "hr" : "employee";
}

function toastErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

function dateInputValue(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN");
}

function renderEmployeeFields(
  employee: Employee | undefined,
  userRole: Role | undefined,
  companies: Company[],
) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {userRole === "super-admin" && (
        <div className="sm:col-span-2">
          <Label>Company</Label>
          <Select name="companyId" defaultValue={employee?.companyId || companies[0]?.id || "c1"}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.companyId || company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="sm:col-span-2">
        <Label>Portal role</Label>
        <Select name="role" defaultValue={employee?.role || "employee"}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select portal role" />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor={employee ? "edit-name" : "name"}>Name</Label>
        <Input
          id={employee ? "edit-name" : "name"}
          name="name"
          defaultValue={employee?.name}
          className="mt-1"
          required
        />
      </div>
      <div>
        <Label htmlFor={employee ? "edit-email" : "email"}>Email</Label>
        <Input
          id={employee ? "edit-email" : "email"}
          name="email"
          type="email"
          defaultValue={employee?.email}
          className="mt-1"
          readOnly={Boolean(employee)}
          required
        />
      </div>
      {!employee && (
        <div>
          <Label htmlFor="password">Portal password</Label>
          <PasswordInput id="password" name="password" className="mt-1" minLength={8} required />
        </div>
      )}
      {employee && (
        <div>
          <Label htmlFor="edit-password">New portal password</Label>
          <PasswordInput id="edit-password" name="password" className="mt-1" minLength={8} />
        </div>
      )}
      <div>
        <Label htmlFor={employee ? "edit-department" : "department"}>Department</Label>
        <Input
          id={employee ? "edit-department" : "department"}
          name="department"
          defaultValue={employee?.department}
          className="mt-1"
          required={!employee}
        />
      </div>
      <div>
        <Label htmlFor={employee ? "edit-designation" : "designation"}>Designation</Label>
        <Input
          id={employee ? "edit-designation" : "designation"}
          name="designation"
          defaultValue={employee?.designation}
          className="mt-1"
          required={!employee}
        />
      </div>
      <div>
        <Label htmlFor={employee ? "edit-location" : "location"}>Location</Label>
        <Input
          id={employee ? "edit-location" : "location"}
          name="location"
          defaultValue={employee?.location}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor={employee ? "edit-manager" : "manager"}>Manager</Label>
        <Input
          id={employee ? "edit-manager" : "manager"}
          name="manager"
          defaultValue={employee?.manager}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor={employee ? "edit-employeeNo" : "employeeNo"}>Employee No.</Label>
        <Input
          id={employee ? "edit-employeeNo" : "employeeNo"}
          name="employeeNo"
          defaultValue={employee?.employeeNo}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor={employee ? "edit-joinDate" : "joinDate"}>Joining date</Label>
        <Input
          id={employee ? "edit-joinDate" : "joinDate"}
          name="joinDate"
          type="date"
          defaultValue={dateInputValue(employee?.joinDate)}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor={employee ? "edit-baseSalary" : "baseSalary"}>Base salary</Label>
        <Input
          id={employee ? "edit-baseSalary" : "baseSalary"}
          name="baseSalary"
          type="number"
          defaultValue={employee?.baseSalary}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor={employee ? "edit-monthlyCtc" : "monthlyCtc"}>Monthly CTC</Label>
        <Input
          id={employee ? "edit-monthlyCtc" : "monthlyCtc"}
          name="monthlyCtc"
          type="number"
          defaultValue={employee?.monthlyCtc ?? employee?.salary}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor={employee ? "edit-annualCtc" : "annualCtc"}>Annual CTC</Label>
        <Input
          id={employee ? "edit-annualCtc" : "annualCtc"}
          name="annualCtc"
          type="number"
          defaultValue={employee?.annualCtc}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor={employee ? "edit-bankName" : "bankName"}>Bank name</Label>
        <Input
          id={employee ? "edit-bankName" : "bankName"}
          name="bankName"
          defaultValue={employee?.bankName}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor={employee ? "edit-bankAccount" : "bankAccount"}>Bank account</Label>
        <Input
          id={employee ? "edit-bankAccount" : "bankAccount"}
          name="bankAccount"
          defaultValue={employee?.bankAccount}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor={employee ? "edit-pan" : "pan"}>PAN</Label>
        <Input
          id={employee ? "edit-pan" : "pan"}
          name="pan"
          defaultValue={employee?.pan}
          className="mt-1"
        />
      </div>
    </div>
  );
}

export default function Employees() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const { employees, documents } = useAppSelector((s) => s.workspace);
  const companies = useAppSelector((s) => s.company.list);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [viewingDocumentsFor, setViewingDocumentsFor] = useState<Employee | null>(null);
  const employeeDocuments = viewingDocumentsFor
    ? documents.filter((document) => document.employeeId === viewingDocumentsFor.id)
    : [];

  const refreshSavedData = async () => {
    await Promise.all([dispatch(fetchEmployees()).unwrap(), dispatch(fetchWorkspace()).unwrap()]);
  };

  const saveEmployeeDetails = async (event: FormEvent<HTMLFormElement>, employee?: Employee) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? employee?.email ?? "").trim();
    const department = String(form.get("department") ?? "").trim();
    const designation = String(form.get("designation") ?? "").trim();
    const monthlyCtc = Number(form.get("monthlyCtc") || 0);
    const selectedRole = String(form.get("role") ?? employee?.role ?? "employee") as Role;
    const password = String(form.get("password") ?? "").trim();
    const joinDate = String(form.get("joinDate") ?? "").trim();
    const payload = {
      name,
      email,
      ...(password ? { password } : {}),
      role:
        selectedRole === "employee" ? inferRoleFromDetails(department, designation) : selectedRole,
      department,
      designation,
      location: String(form.get("location") ?? "").trim(),
      manager: String(form.get("manager") ?? "").trim(),
      employeeNo: String(form.get("employeeNo") ?? "").trim(),
      salary: monthlyCtc,
      baseSalary: Number(form.get("baseSalary") || 0),
      monthlyCtc,
      annualCtc: Number(form.get("annualCtc") || (employee ? 0 : monthlyCtc * 12)),
      bankName: String(form.get("bankName") ?? "").trim(),
      bankAccount: String(form.get("bankAccount") ?? "").trim(),
      pan: String(form.get("pan") ?? "").trim(),
      companyId: String(form.get("companyId") ?? "").trim() || undefined,
    };

    try {
      if (employee) {
        await dispatch(updateEmployee({ id: employee.id, ...payload, joinDate })).unwrap();
        await refreshSavedData();
        toast.success(`${name} updated`);
        setEditing(null);
      } else {
        await dispatch(createEmployee({ ...payload, ...(joinDate ? { joinDate } : {}) })).unwrap();
        await refreshSavedData();
        toast.success(`${name} added`);
        setOpen(false);
        formElement.reset();
      }
    } catch (error) {
      toast.error(toastErrorMessage(error, "Unable to save employee"));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Management"
        subtitle="View and manage your workforce."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add employee</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={(event) => saveEmployeeDetails(event)}>
                {renderEmployeeFields(undefined, user?.role, companies)}
                <Button type="submit" className="w-full">
                  Save employee
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <Dialog open={Boolean(editing)} onOpenChange={(value) => !value && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit employee</DialogTitle>
          </DialogHeader>
          {editing && (
            <form className="space-y-4" onSubmit={(event) => saveEmployeeDetails(event, editing)}>
              {renderEmployeeFields(editing, user?.role, companies)}
              <Button type="submit" className="w-full">
                Save details
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(viewingDocumentsFor)}
        onOpenChange={(value) => !value && setViewingDocumentsFor(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewingDocumentsFor?.name} documents</DialogTitle>
          </DialogHeader>
          <DataTable
            data={employeeDocuments}
            pageSize={5}
            searchKeys={["name", "type", "status"]}
            emptyMessage="No documents uploaded for this employee yet"
            columns={[
              { key: "name", header: "Document" },
              { key: "type", header: "Type" },
              { key: "uploadedOn", header: "Uploaded" },
              {
                key: "status",
                header: "Status",
                render: (doc) => <StatusBadge status={doc.status} />,
              },
              {
                key: "fileUrl",
                header: "File",
                render: (doc) =>
                  doc.fileUrl ? (
                    <Button asChild size="sm" variant="outline">
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open
                      </a>
                    </Button>
                  ) : (
                    "-"
                  ),
              },
              {
                key: "id",
                header: "Review",
                render: (doc) => (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        dispatch(updateDocumentStatus({ id: doc.id, status: "verified" }))
                      }
                    >
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        dispatch(updateDocumentStatus({ id: doc.id, status: "needs-update" }))
                      }
                    >
                      Update
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </DialogContent>
      </Dialog>
      <DataTable
        data={employees}
        searchKeys={[
          "name",
          "email",
          "employeeNo",
          "department",
          "designation",
          "location",
          "bankName",
          "bankAccount",
          "pan",
        ]}
        toolbar={<ExportButtons rows={employees} filename="employees" />}
        columns={[
          {
            key: "name",
            header: "Employee",
            render: (e) => (
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    {e.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{e.name}</p>
                  <p className="text-xs text-muted-foreground">{e.email}</p>
                </div>
              </div>
            ),
          },
          { key: "employeeNo", header: "Employee No." },
          { key: "department", header: "Department" },
          { key: "designation", header: "Designation" },
          { key: "bankName", header: "Bank" },
          { key: "location", header: "Location" },
          { key: "joinDate", header: "Joined", render: (e) => formatDate(e.joinDate) },
          {
            key: "status",
            header: "Status",
            render: (e) => <StatusBadge status={e.exitDate ? "exited" : e.status} />,
          },
          {
            key: "id",
            header: "Actions",
            render: (employee) => (
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  aria-label={`Edit ${employee.name}`}
                  onClick={() => setEditing(employee)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label={`View ${employee.name} documents`}
                  onClick={() => setViewingDocumentsFor(employee)}
                >
                  <FileText className="h-4 w-4" />
                </Button>
                {employee.id !== user?.id &&
                  employee.role !== "super-admin" &&
                  employee.status !== "inactive" &&
                  !employee.exitDate && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate(`/hr/exit?employeeId=${encodeURIComponent(employee.id)}`)
                      }
                    >
                      <LogOut className="mr-1 h-4 w-4" />
                      Exit / Inactive
                    </Button>
                  )}
                {employee.status !== "active" && !employee.exitDate && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await dispatch(
                          updateEmployee({ id: employee.id, status: "active" }),
                        ).unwrap();
                        await refreshSavedData();
                        toast.success(`${employee.name} can access the portal`);
                      } catch (error) {
                        toast.error(toastErrorMessage(error, "Unable to update access"));
                      }
                    }}
                  >
                    Allow access
                  </Button>
                )}
              </div>
            ),
          },
        ]}
      />
      <DataTable
        data={documents}
        searchKeys={["employeeName", "name", "type", "status"]}
        emptyMessage="No employee documents uploaded yet"
        columns={[
          { key: "employeeName", header: "Employee" },
          { key: "name", header: "Document" },
          { key: "type", header: "Type" },
          { key: "uploadedOn", header: "Uploaded" },
          { key: "status", header: "Status", render: (doc) => <StatusBadge status={doc.status} /> },
          {
            key: "fileUrl",
            header: "File",
            render: (doc) =>
              doc.fileUrl ? (
                <Button asChild size="sm" variant="outline">
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open
                  </a>
                </Button>
              ) : (
                "-"
              ),
          },
          {
            key: "id",
            header: "Review",
            render: (doc) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => dispatch(updateDocumentStatus({ id: doc.id, status: "verified" }))}
                >
                  Verify
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    dispatch(updateDocumentStatus({ id: doc.id, status: "needs-update" }))
                  }
                >
                  Update
                </Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
