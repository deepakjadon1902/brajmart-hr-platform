import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchTeams } from "@/store/slices/teamsSlice";

export default function MyTeam() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const { list, loading, error } = useAppSelector((state) => state.teams);
  const team = list.find((item) => item.members.some((member) => member.id === userId));
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Team"
        subtitle="Your team, reporting manager, and colleagues."
        actions={
          <Button variant="outline" onClick={() => void dispatch(fetchTeams())}>
            Refresh team
          </Button>
        }
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {team ? (
        <>
          <Card className="space-y-2 p-6 shadow-soft">
            <h2 className="text-xl font-semibold">{team.name}</h2>
            {team.description && (
              <p className="text-sm text-muted-foreground">{team.description}</p>
            )}
            <p className="text-sm">
              Team manager: <span className="font-medium">{team.managerName}</span>
            </p>
            {team.managerEmail && (
              <a
                href={`mailto:${team.managerEmail}`}
                className="text-sm text-primary hover:underline"
              >
                {team.managerEmail}
              </a>
            )}
            <p className="text-sm text-muted-foreground">{team.members.length} team members</p>
          </Card>
          <DataTable
            data={team.members}
            searchKeys={["name", "email", "designation"]}
            columns={[
              {
                key: "name",
                header: "Member",
                render: (member) => (
                  <span className="font-medium">
                    {member.name}
                    {member.id === userId ? " (You)" : ""}
                  </span>
                ),
              },
              { key: "email", header: "Email" },
              { key: "designation", header: "Designation" },
              { key: "department", header: "Department" },
              {
                key: "status",
                header: "Account status",
                render: (member) => <StatusBadge status={member.status} />,
              },
            ]}
          />
        </>
      ) : (
        <Card className="p-8 text-center text-muted-foreground">
          {loading
            ? "Loading your team..."
            : "You have not been assigned to a team yet. Your team will appear here when your manager adds you."}
        </Card>
      )}
    </div>
  );
}
