import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card } from "@/components/ui/card";
import { Activity, Building2, ShieldCheck, Users } from "lucide-react";
import { useAppSelector } from "@/store";

export default function P() {
  const employees = useAppSelector((s) => s.workspace.employees);
  const companyCount = useAppSelector((s) => s.company.list.length);
  const activeRoles = new Set(employees.map((employee) => employee.role)).size;

  return (
    <div className="space-y-6">
      <PageHeader title="Super Admin" subtitle="Govern multi-company operations from one place." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Companies"
          value={String(companyCount)}
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatCard
          label="Total users"
          value={String(employees.length)}
          tone="success"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Active roles"
          value={String(activeRoles)}
          tone="info"
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <StatCard
          label="System health"
          value="-"
          tone="success"
          icon={<Activity className="h-5 w-5" />}
        />
      </div>
      <Card className="p-6 shadow-soft">
        <h3 className="font-semibold">Platform usage</h3>
        <p className="mt-4 text-sm text-muted-foreground">
          No platform usage records found in the database.
        </p>
      </Card>
    </div>
  );
}
