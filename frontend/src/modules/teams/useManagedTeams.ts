import { useMemo } from "react";
import { useAppSelector } from "@/store";
export { todayInIndia } from "@/utils/date";

export function useManagedTeams(selected = "all") {
  const user = useAppSelector((state) => state.auth.user);
  const activeCompany = useAppSelector((state) => state.company.activeId);
  const allTeams = useAppSelector((state) => state.teams.list);
  const companyId = user?.role === "super-admin" ? activeCompany : user?.companyId;
  const teams = useMemo(
    () =>
      allTeams.filter(
        (team) =>
          team.companyId === companyId &&
          (["hr", "super-admin"].includes(user?.role || "") || team.managerId === user?.id),
      ),
    [allTeams, companyId, user?.id, user?.role],
  );
  const members = useMemo(
    () =>
      teams
        .filter((team) => selected === "all" || team.id === selected)
        .flatMap((team) => team.members),
    [selected, teams],
  );
  const memberIds = useMemo(() => new Set(members.map((member) => member.id)), [members]);
  return { teams, members, memberIds };
}
