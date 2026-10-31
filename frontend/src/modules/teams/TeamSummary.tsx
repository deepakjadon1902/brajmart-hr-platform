import { Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useAppSelector } from "@/store";

export function TeamSummary() {
  const userId = useAppSelector((state) => state.auth.user?.id);
  const { list, error, loading } = useAppSelector((state) => state.teams);
  const team = list.find((item) => item.members.some((member) => member.id === userId));
  return (
    <Card className="flex flex-wrap items-center gap-4 p-4 shadow-soft">
      <div className="rounded-xl bg-primary/10 p-3 text-primary">
        <Users className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">My team</p>
        <p className="font-semibold">
          {team?.name ||
            (error
              ? "Team information unavailable"
              : loading
                ? "Loading team..."
                : "No team assigned yet")}
        </p>
        {team && (
          <p className="text-sm text-muted-foreground">
            Manager: {team.managerName} · {team.members.length} members
          </p>
        )}
      </div>
      <Link className="text-sm font-medium text-primary hover:underline" to="/employee/team">
        View my team
      </Link>
    </Card>
  );
}
