import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store";
import { addRoleAssignment } from "@/store/slices/workspaceSlice";

export default function P() {
  const dispatch = useAppDispatch();
  const { employees, roleAssignments } = useAppSelector((s) => s.workspace);
  const [open, setOpen] = useState(false);

  const onAssign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await dispatch(
        addRoleAssignment({
          employeeId: String(form.get("employeeId") ?? ""),
          roleName: String(form.get("roleName") ?? "").trim(),
          workScope: String(form.get("workScope") ?? "").trim(),
        }),
      ).unwrap();
      toast.success("Role assigned");
      setOpen(false);
      event.currentTarget.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to assign role");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role Management"
        subtitle="View assigned roles and employee work scope."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Assign role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign role</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={onAssign}>
                <div>
                  <Label>Employee</Label>
                  <Select name="employeeId" required>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} - {employee.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="role-name">Role</Label>
                  <Input id="role-name" name="roleName" className="mt-1" required />
                </div>
                <div>
                  <Label htmlFor="work-scope">Work scope</Label>
                  <Input id="work-scope" name="workScope" className="mt-1" required />
                </div>
                <Button type="submit" className="w-full">
                  Save role
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <DataTable
        data={roleAssignments}
        searchKeys={["employeeName", "roleName", "workScope"]}
        columns={[
          { key: "employeeName", header: "Employee" },
          { key: "roleName", header: "Role" },
          { key: "workScope", header: "Work Scope" },
        ]}
      />
    </div>
  );
}
