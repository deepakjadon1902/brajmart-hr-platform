import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchTeamOptions, fetchTeams, saveTeam } from "@/store/slices/teamsSlice";
import { fetchEmployees, fetchTeamActivity } from "@/store/slices/workspaceSlice";
import { useManagedTeams, todayInIndia } from "@/modules/teams/useManagedTeams";
import { useTeamActivityRefresh } from "@/modules/teams/useTeamActivityRefresh";
import type { Team } from "@/types";

export default function Teams() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const {
    members: options,
    managers,
    optionsLoading,
    optionsError,
  } = useAppSelector((state) => state.teams);
  const { error, loading } = useAppSelector((state) => state.teams);
  const { teams, members } = useManagedTeams();
  const { attendance, leaves, tasks } = useAppSelector((state) => state.workspace);
  const activity = useTeamActivityRefresh();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [managerId, setManagerId] = useState(user?.id || "");
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const admin = ["hr", "super-admin"].includes(user?.role || "");
  useEffect(() => {
    if (open) void dispatch(fetchTeamOptions());
  }, [dispatch, open]);
  const edit = (team: Team | null) => {
    setEditing(team);
    setName(team?.name || "");
    setDescription(team?.description || "");
    setManagerId(team?.managerId || user?.id || "");
    setSelected(team?.members.map((member) => member.id) || []);
    setSearch("");
    setSaveError("");
    setOpen(true);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaveError("");
    try {
      await dispatch(
        saveTeam({
          ...(editing ? { id: editing.id } : {}),
          name,
          description,
          managerId,
          memberIds: selected,
        }),
      ).unwrap();
      setOpen(false);
      toast.success(editing ? "Team updated" : "Team created");
      void dispatch(fetchEmployees());
      void dispatch(fetchTeamActivity());
      void dispatch(fetchTeams());
    } catch (error) {
      setSaveError((error as { message?: string }).message || "Unable to save team");
    } finally {
      setSaving(false);
    }
  };
  const filteredOptions = options.filter((member) =>
    `${member.name} ${member.email} ${member.department || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Teams"
        subtitle="Create teams, choose members, and manage their day-to-day work."
        actions={
          <Button onClick={() => edit(null)}>
            <Plus className="mr-2 h-4 w-4" />
            Create team
          </Button>
        }
      />
      {(error || activity.error) && (
        <p role="alert" className="text-sm text-destructive">
          {error || activity.error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Teams</p>
          <p className="text-2xl font-semibold">{teams.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Team members</p>
          <p className="text-2xl font-semibold">{members.length}</p>
        </Card>
      </div>
      {!teams.length && (
        <Card className="p-8 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">{loading ? "Loading teams..." : "Create your first team"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Select employees to start assigning tasks and monitoring attendance and leave.
          </p>
        </Card>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        {teams.map((team) => {
          const ids = new Set(team.members.map((member) => member.id));
          const present = new Set(
            attendance
              .filter(
                (record) =>
                  ids.has(record.employeeId || "") &&
                  record.date === todayInIndia() &&
                  ["present", "late", "half-day"].includes(record.status),
              )
              .map((record) => record.employeeId),
          ).size;
          const pending = leaves.filter(
            (leave) => ids.has(leave.employeeId || "") && leave.status === "pending",
          ).length;
          const openTasks = tasks.filter(
            (task) => ids.has(task.employeeId) && task.status !== "completed",
          ).length;
          return (
            <Card key={team.id} className="space-y-4 p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{team.name}</h2>
                  <p className="text-sm text-muted-foreground">Manager: {team.managerName}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => edit(team)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Manage team
                </Button>
              </div>
              {team.description && (
                <p className="text-sm text-muted-foreground">{team.description}</p>
              )}
              <div className="grid grid-cols-3 gap-3 rounded-lg bg-muted/40 p-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Present today</p>
                  <p className="font-semibold">
                    {present}/{team.members.length}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pending leave</p>
                  <p className="font-semibold">{pending}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Open tasks</p>
                  <p className="font-semibold">{openTasks}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {team.members.length ? (
                  team.members.map((member) => (
                    <span key={member.id} className="rounded-full border px-2.5 py-1 text-xs">
                      {member.name}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No members yet.</p>
                )}
              </div>
              <div className="flex flex-wrap gap-3 border-t pt-3 text-sm font-medium text-primary">
                <Link to={`/team-manager/tasks?team=${team.id}`}>Assign and monitor tasks</Link>
                <Link to={`/team-manager/attendance?team=${team.id}`}>Attendance</Link>
                <Link to={`/team-manager/leaves?team=${team.id}`}>Leave requests</Link>
              </div>
            </Card>
          );
        })}
      </div>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!saving) setOpen(value);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Manage team" : "Create team"}</DialogTitle>
            <DialogDescription>
              Each employee belongs to one team. Save your selection to update their portal.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="team-name">Team name</Label>
              <Input
                id="team-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={120}
                required
                disabled={saving}
              />
            </div>
            <div>
              <Label htmlFor="team-description">Description</Label>
              <Textarea
                id="team-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={1000}
                disabled={saving}
              />
            </div>
            {admin && (
              <div>
                <Label htmlFor="team-manager">Team manager</Label>
                <Select
                  value={managerId}
                  onValueChange={(id) => {
                    setManagerId(id);
                    setSelected((current) => current.filter((memberId) => memberId !== id));
                  }}
                  disabled={saving || optionsLoading}
                >
                  <SelectTrigger id="team-manager">
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name} - {manager.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="team-members-search">Team members ({selected.length} selected)</Label>
              <Input
                id="team-members-search"
                placeholder="Search employees by name, email, or department"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                disabled={saving}
              />
              {optionsError && (
                <div className="text-sm text-destructive" role="alert">
                  {optionsError}
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => void dispatch(fetchTeamOptions())}
                  >
                    Retry
                  </Button>
                </div>
              )}
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-2">
                {optionsLoading ? (
                  <p className="p-3 text-sm text-muted-foreground">Loading employees...</p>
                ) : !filteredOptions.length ? (
                  <p className="p-3 text-sm text-muted-foreground">No matching employees.</p>
                ) : (
                  filteredOptions.map((member) => {
                    const inOtherTeam = Boolean(member.teamId && member.teamId !== editing?.id);
                    const disabled =
                      saving ||
                      member.id === managerId ||
                      inOtherTeam ||
                      (member.status === "inactive" && !selected.includes(member.id));
                    return (
                      <label
                        key={member.id}
                        className={`flex items-start gap-3 rounded-md p-2 ${disabled ? "opacity-60" : "cursor-pointer hover:bg-muted/50"}`}
                      >
                        <Checkbox
                          checked={selected.includes(member.id)}
                          disabled={disabled}
                          onCheckedChange={(checked) =>
                            setSelected((current) =>
                              checked
                                ? [...new Set([...current, member.id])]
                                : current.filter((id) => id !== member.id),
                            )
                          }
                          aria-label={`Select ${member.name}`}
                        />
                        <span className="min-w-0 text-sm">
                          <span className="block font-medium">{member.name}</span>
                          <span className="block break-all text-xs text-muted-foreground">
                            {member.email}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {member.id === managerId
                              ? "Team manager"
                              : inOtherTeam
                                ? `Already in ${member.teamName || "another team"}`
                                : member.status === "inactive"
                                  ? "Inactive employee"
                                  : member.department || "Available"}
                          </span>
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
            {saveError && (
              <p role="alert" className="text-sm text-destructive">
                {saveError}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={saving || optionsLoading || !!optionsError || !managerId}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Saving team..." : editing ? "Save team" : "Create team"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
