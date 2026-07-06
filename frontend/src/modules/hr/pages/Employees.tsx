import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { ExportButtons } from "@/components/common/ExportButtons";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store";
import { addEmployee, updateDocumentStatus } from "@/store/slices/workspaceSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Employees() {
  const dispatch = useAppDispatch();
  const { employees, documents } = useAppSelector((s) => s.workspace);
  const [open, setOpen] = useState(false);

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
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  const name = String(form.get("name") ?? "").trim();
                  const email = String(form.get("email") ?? "").trim();
                  const department = String(form.get("department") ?? "").trim();
                  const designation = String(form.get("designation") ?? "").trim();
                  const monthlyCtc = Number(form.get("monthlyCtc") || 0);

                  dispatch(
                    addEmployee({
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
                    }),
                  );
                  toast.success(`${name} added`);
                  setOpen(false);
                  event.currentTarget.reset();
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" className="mt-1" required />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" className="mt-1" required />
                  </div>
                  <div>
                    <Label htmlFor="password">Portal password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      className="mt-1"
                      defaultValue="Welcome@123"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" name="department" className="mt-1" required />
                  </div>
                  <div>
                    <Label htmlFor="designation">Designation</Label>
                    <Input id="designation" name="designation" className="mt-1" required />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      className="mt-1"
                      defaultValue="Bengaluru"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manager">Manager</Label>
                    <Input id="manager" name="manager" className="mt-1" defaultValue="Rohan Das" />
                  </div>
                  <div>
                    <Label htmlFor="baseSalary">Base salary</Label>
                    <Input
                      id="baseSalary"
                      name="baseSalary"
                      type="number"
                      className="mt-1"
                      defaultValue={50000}
                    />
                  </div>
                  <div>
                    <Label htmlFor="monthlyCtc">Monthly CTC</Label>
                    <Input
                      id="monthlyCtc"
                      name="monthlyCtc"
                      type="number"
                      className="mt-1"
                      defaultValue={60000}
                    />
                  </div>
                  <div>
                    <Label htmlFor="annualCtc">Annual CTC</Label>
                    <Input
                      id="annualCtc"
                      name="annualCtc"
                      type="number"
                      className="mt-1"
                      defaultValue={720000}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankAccount">Bank account</Label>
                    <Input id="bankAccount" name="bankAccount" className="mt-1" />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Save employee
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
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
