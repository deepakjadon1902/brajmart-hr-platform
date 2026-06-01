import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
const perms=["View Employees","Edit Employees","Approve Leaves","Manage Payroll","Configure Holidays","Export Reports","Send Mass Emails","Manage Roles"];
export default function P(){return(<div className="space-y-6"><PageHeader title="Permissions" subtitle="Fine-grained access control." />
<Card className="divide-y p-0 shadow-soft">{perms.map((p,i)=>(<div key={p} className="flex items-center justify-between p-4"><div><p className="font-medium">{p}</p><p className="text-xs text-muted-foreground">Controls who can perform this action.</p></div><Switch defaultChecked={i%2===0}/></div>))}</Card></div>);}
