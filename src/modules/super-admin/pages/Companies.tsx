import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store";
import { setActive } from "@/store/slices/companySlice";
export default function P(){
  const { list, activeId } = useAppSelector(s=>s.company);
  const d = useAppDispatch();
  return (<div className="space-y-6"><PageHeader title="Companies" subtitle="Manage tenants on the platform." actions={<Button><Plus className="mr-2 h-4 w-4"/>New company</Button>} />
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{list.map(c=>(
    <Card key={c.id} className={`p-5 shadow-soft transition-all ${activeId===c.id?"ring-2 ring-primary":""}`}>
      <div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Building2 className="h-5 w-5"/></div>
      <div><h3 className="font-semibold">{c.name}</h3><p className="text-xs text-muted-foreground">{c.id}</p></div></div>
      <Button variant={activeId===c.id?"default":"outline"} size="sm" className="mt-4 w-full" onClick={()=>d(setActive(c.id))}>{activeId===c.id?"Active":"Switch to"}</Button>
    </Card>))}</div></div>);
}
