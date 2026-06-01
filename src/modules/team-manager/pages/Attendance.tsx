import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { employees, attendance } from "@/services/mock";
const rows = employees.slice(0,8).map((e,i)=>({id:e.id,name:e.name,date:attendance[i].date,checkIn:attendance[i].checkIn,hours:attendance[i].hoursWorked,status:attendance[i].status}));
export default function P(){return(<div className="space-y-6"><PageHeader title="Team Attendance" subtitle="Your team's attendance today." />
<DataTable data={rows} searchKeys={["name","status"]} columns={[{key:"name",header:"Member"},{key:"date",header:"Date"},{key:"checkIn",header:"In"},{key:"hours",header:"Hours"},{key:"status",header:"Status",render:(r)=> <StatusBadge status={r.status} />}]} /></div>);}
