import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";

const jobs = [
  {
    id: "j1",
    title: "Senior Frontend Engineer",
    dept: "Engineering",
    loc: "Bengaluru",
    applicants: 142,
    status: "active",
  },
  {
    id: "j2",
    title: "Product Designer",
    dept: "Design",
    loc: "Remote",
    applicants: 86,
    status: "active",
  },
  {
    id: "j3",
    title: "Account Executive",
    dept: "Sales",
    loc: "Mumbai",
    applicants: 54,
    status: "pending",
  },
  {
    id: "j4",
    title: "Finance Analyst",
    dept: "Finance",
    loc: "Pune",
    applicants: 31,
    status: "active",
  },
];

export default function Recruitment() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruitment"
        subtitle="Open positions and applicant funnel."
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Job
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((j) => (
          <Card key={j.id} className="p-5 shadow-soft transition-transform hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{j.title}</h3>
                <p className="text-xs text-muted-foreground">{j.dept}</p>
              </div>
              <StatusBadge status={j.status} />
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {j.loc}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {j.applicants} applicants
              </span>
            </div>
            <Button variant="outline" size="sm" className="mt-4 w-full">
              View pipeline
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
