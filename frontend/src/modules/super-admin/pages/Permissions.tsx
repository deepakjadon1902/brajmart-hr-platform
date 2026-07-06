import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAppDispatch, useAppSelector } from "@/store";
import { setPermissionGrant } from "@/store/slices/workspaceSlice";

export default function P() {
  const dispatch = useAppDispatch();
  const grants = useAppSelector((s) => s.workspace.permissionGrants);

  return (
    <div className="space-y-6">
      <PageHeader title="Permissions" subtitle="Fine-grained access control." />
      <Card className="divide-y p-0 shadow-soft">
        {grants.map((grant) => (
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
      </Card>
    </div>
  );
}
