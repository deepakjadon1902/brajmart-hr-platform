import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
const rows=[{id:"r1",name:"Super Admin",scope:"Platform",users:2},{id:"r2",name:"HR",scope:"Company",users:8},{id:"r3",name:"Team Manager",scope:"Department",users:24},{id:"r4",name:"Employee",scope:"Self",users:578}];
export default function P(){return(<div className="space-y-6"><PageHeader title="Role Management" subtitle="Define system-wide roles." />
<DataTable data={rows} searchKeys={["name","scope"]} columns={[{key:"name",header:"Role"},{key:"scope",header:"Scope"},{key:"users",header:"Users"}]} /></div>);}
