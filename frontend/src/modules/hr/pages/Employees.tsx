import { useState } from "react";
import type { FormEvent } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { ExportButtons } from "@/components/common/ExportButtons";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Pencil, Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store";
import { createEmployee, updateDocumentStatus, updateEmployee } from "@/store/slices/workspaceSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Employee } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Employees() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { employees, documents } = useAppSelector((s) => s.workspace);
  const companies = useAppSelector((s) => s.company.list);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const saveEmployeeDetails = async (event: FormEvent<HTMLFormElement>, employee?: Employee) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const department = String(form.get("department") ?? "").trim();
    const designation = String(form.get("designation") ?? "").trim();
    const monthlyCtc = Number(form.get("monthlyCtc") || 0);
    const payload = {
      name,
      email,
      password: String(form.get("password") ?? "").trim(),
      department,
      designation,
      location: String(form.get("location") ?? "").trim(),
      manager: String(form.get("manager") ?? "").trim(),
      salary: monthlyCtc,
      baseSalary: Number(form.get("baseSalary") || 0),
      monthlyCtc,
      annualCtc: Number(form.get("annualCtc") || monthlyCtc * 12),
      bankAccount: String(form.get("bankAccount") ?? "").trim(),
      companyId: String(form.get("companyId") ?? "").trim() || undefined,
    };

    try {
      if (employee) {
        await dispatch(updateEmployee({ id: employee.id, ...payload })).unwrap();
        toast.success(`${name} updated`);
        setEditing(null);
      } else {
        await dispatch(createEmployee(payload)).unwrap();
        toast.success(`${name} added`);
        setOpen(false);
        formElement.reset();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save employee");
    }
  };

  const EmployeeFields = ({ employee }: { employee?: Employee }) => (
    <div className="grid gap-3 sm:grid-cols-2">
      {user?.role === "super-admin" && (
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
      <div>
        <Label htmlFor={employee ? "edit-name" : "name"}>Name</Label>
        <Input id={employee ? "edit-name" : "name"} name="name" defaultValue={employee?.name} className="mt-1" required />
      </div>
      <div>
        <Label htmlFor={employee ? "edit-email" : "email"}>Email</Label>
        <Input
          id={employee ? "edit-email" : "email"}
          name="email"
          type="email"
          defaultValue={employee?.email}
          className="mt-1"
          disabled={Boolean(employee)}
          required
        />
      </div>
      {!employee && (
        <div>
          <Label htmlFor="password">Portal password</Label>
          <Input id="password" name="password" type="password" className="mt-1" required />
        </div>
      )}
      <div>
        <Label htmlFor={employee ? "edit-department" : "department"}>Department</Label>
        <Input id={employee ? "edit-department" : "department"} name="department" defaultValue={employee?.department} className="mt-1" required />
      </div>
      <div>
        <Label htmlFor={employee ? "edit-designation" : "designation"}>Designation</Label>
        <Input id={employee ? "edit-designation" : "designation"} name="designation" defaultValue={employee?.designation} className="mt-1" required />
      </div>
      <div>
        <Label htmlFor={employee ? "edit-location" : "location"}>Location</Label>
        <Input id={employee ? "edit-location" : "location"} name="location" defaultValue={employee?.location} className="mt-1" />
      </div>
      <div>
        <Label htmlFor={employee ? "edit-manager" : "manager"}>Manager</Label>
        <Input id={employee ? "edit-manager" : "manager"} name="manager" defaultValue={employee?.manager} className="mt-1" />
      </div>
      <div>
        <Label htmlFor={employee ? "edit-baseSalary" : "baseSalary"}>Base salary</Label>
        <Input id={employee ? "edit-baseSalary" : "baseSalary"} name="baseSalary" type="number" defaultValue={employee?.baseSalary} className="mt-1" />
      </div>
      <div>
        <Label htmlFor={employee ? "edit-monthlyCtc" : "monthlyCtc"}>Monthly CTC</Label>
        <Input id={employee ? "edit-monthlyCtc" : "monthlyCtc"} name="monthlyCtc" type="number" defaultValue={employee?.monthlyCtc ?? employee?.salary} className="mt-1" />
      </div>
      <div>
        <Label htmlFor={employee ? "edit-annualCtc" : "annualCtc"}>Annual CTC</Label>
        <Input id={employee ? "edit-annualCtc" : "annualCtc"} name="annualCtc" type="number" defaultValue={employee?.annualCtc} className="mt-1" />
      </div>
      <div>
        <Label htmlFor={employee ? "edit-bankAccount" : "bankAccount"}>Bank account</Label>
        <Input id={employee ? "edit-bankAccount" : "bankAccount"} name="bankAccount" defaultValue={employee?.bankAccount} className="mt-1" />
      </div>
    </div>
  );

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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add employee</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(event) => saveEmployeeDetails(event)}
              >
                <EmployeeFields />
                <Button type="submit" className="w-full">
                  Save employee
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <Dialog open={Boolean(editing)} onOpenChange={(value) => !value && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit employee</DialogTitle>
          </DialogHeader>
          {editing && (
            <form className="space-y-4" onSubmit={(event) => saveEmployeeDetails(event, editing)}>
              <EmployeeFields employee={editing} />
              <Button type="submit" className="w-full">
                Save details
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <DataTable
        data={employees}
        searchKeys={["name", "email", "department", "designation", "location"]}
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
          { key: "department", header: "Department" },
          { key: "designation", header: "Designation" },
          { key: "location", header: "Location" },
          { key: "joinDate", header: "Joined" },
          { key: "status", header: "Status", render: (e) => <StatusBadge status={e.status} /> },
          {
            key: "id",
            header: "Access",
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
                  size="sm"
                  variant={employee.status === "inactive" ? "default" : "outline"}
                  onClick={async () => {
                    try {
                      await dispatch(updateEmployee({ id: employee.id, status: "active" })).unwrap();
                      toast.success(`${employee.name} can access the portal`);
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Unable to update access");
                    }
                  }}
                >
                  Allow
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    try {
                      await dispatch(updateEmployee({ id: employee.id, status: "inactive" })).unwrap();
                      toast.success(`${employee.name} is blocked from login`);
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Unable to update access");
                    }
                  }}
                >
                  Block
                </Button>
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
