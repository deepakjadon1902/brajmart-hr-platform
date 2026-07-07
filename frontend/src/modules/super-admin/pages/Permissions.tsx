import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store";
import { addPermissionGrant, setPermissionGrant } from "@/store/slices/workspaceSlice";

export default function P() {
  const dispatch = useAppDispatch();
  const { employees, permissionGrants } = useAppSelector((s) => s.workspace);
  const [open, setOpen] = useState(false);

  const onGrant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await dispatch(
        addPermissionGrant({
          employeeId: String(form.get("employeeId") ?? ""),
          permission: String(form.get("permission") ?? "").trim(),
          granted: true,
        }),
      ).unwrap();
      toast.success("Permission created");
      setOpen(false);
      event.currentTarget.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create permission");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions"
        subtitle="Fine-grained access control."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New permission
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New permission</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={onGrant}>
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
                  <Label htmlFor="permission">Permission</Label>
                  <Input id="permission" name="permission" className="mt-1" required />
                </div>
                <Button type="submit" className="w-full">
                  Save permission
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <Card className="divide-y p-0 shadow-soft">
        {permissionGrants.map((grant) => (
          <div key={grant.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{grant.permission}</p>
              <p className="text-xs text-muted-foreground">{grant.employeeName}</p>
            </div>
            <Switch
              checked={grant.granted}
              onCheckedChange={(checked) =>
                dispatch(setPermissionGrant({ id: grant.id, granted: checked }))
              }
            />
          </div>
        ))}
        {!permissionGrants.length && (
          <div className="p-8 text-center text-sm text-muted-foreground">No permissions created yet</div>
        )}
      </Card>
    </div>
  );
}
