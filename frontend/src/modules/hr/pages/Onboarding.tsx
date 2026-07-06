import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Progress } from "@/components/ui/progress";

import { useAppSelector } from "@/store";

export default function Onboarding() {
  const employees = useAppSelector((s) => s.workspace.employees);
  const data = employees.slice(0, 10).map((e, i) => ({
    id: e.id,
    name: e.name,
    dept: e.department,
    start: e.joinDate,
    progress: 30 + ((i * 11) % 70),
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Onboarding Management" subtitle="Track new hire onboarding progress." />
      <DataTable
        data={data}
        searchKeys={["name", "dept"]}
        columns={[
          { key: "name", header: "New Hire" },
          { key: "dept", header: "Department" },
          { key: "start", header: "Start date" },
          {
            key: "progress",
            header: "Progress",
            render: (r) => (
              <div className="flex items-center gap-3 min-w-[180px]">
                <Progress value={r.progress} className="w-32" />
                <span className="text-xs">{r.progress}%</span>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
