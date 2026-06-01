import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card } from "@/components/ui/card";
import { Building2, Users, ShieldCheck, Activity } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
const data = Array.from({length:12}).map((_,i)=>({m:new Date(2025,i,1).toLocaleString("en",{month:"short"}),v: 200+i*15+((i*7)%30)}));
export default function P(){return(<div className="space-y-6"><PageHeader title="Super Admin" subtitle="Govern multi-company operations from one place." />
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
<StatCard label="Companies" value="3" icon={<Building2 className="h-5 w-5"/>} />
<StatCard label="Total users" value="612" tone="success" icon={<Users className="h-5 w-5"/>} />
<StatCard label="Active roles" value="14" tone="info" icon={<ShieldCheck className="h-5 w-5"/>} />
<StatCard label="System health" value="99.98%" tone="success" icon={<Activity className="h-5 w-5"/>} />
</div>
<Card className="p-6 shadow-soft"><h3 className="font-semibold">Platform usage</h3>
<div className="mt-4 h-64"><ResponsiveContainer><AreaChart data={data}>
<defs><linearGradient id="sa" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4}/><stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0}/></linearGradient></defs>
<XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={11}/><YAxis stroke="var(--color-muted-foreground)" fontSize={11}/>
<Tooltip contentStyle={{background:"var(--color-card)",border:"1px solid var(--color-border)",borderRadius:12}}/>
<Area type="monotone" dataKey="v" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#sa)"/></AreaChart></ResponsiveContainer></div></Card>
</div>);}
