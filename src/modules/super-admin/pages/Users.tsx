import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { ExportButtons } from "@/components/common/ExportButtons";
import { employees } from "@/services/mock";
import { StatusBadge } from "@/components/common/StatusBadge";
export default function P(){return(<div className="space-y-6"><PageHeader title="Users" subtitle="All platform users across companies." />
<DataTable data={employees} searchKeys={["name","email","department"]} toolbar={<ExportButtons rows={employees} filename="users" />}
columns={[{key:"name",header:"Name"},{key:"email",header:"Email"},{key:"department",header:"Dept"},{key:"designation",header:"Designation"},{key:"status",header:"Status",render:(e)=> <StatusBadge status={e.status}/>}]} /></div>);}
