import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
import { canAccessPortal } from "../utils/portalAccess.js";
import { AppError } from "../utils/AppError.js";

export const isPeopleAdmin = (user) =>
  ["hr", "super-admin"].includes(user.role);
export const isTeamManager = (user) =>
  !isPeopleAdmin(user) && canAccessPortal(user, "team-manager");
export const publicMemberFields =
  "name email role companyId department designation phone avatar status joinDate teamId";

export async function managedMemberIds(user, companyId = user.companyId) {
  const teamIds = await Team.find({ companyId, managerId: user.id }).distinct(
    "_id",
  );
  return User.find({ companyId, teamId: { $in: teamIds } }).distinct("_id");
}

export async function canManageMember(
  user,
  employeeId,
  companyId = user.companyId,
) {
  if (isPeopleAdmin(user)) return true;
  if (!isTeamManager(user) || String(employeeId) === user.id) return false;
  const employee = await User.findOne({ _id: employeeId, companyId }).select(
    "teamId",
  );
  if (!employee?.teamId) return false;
  return Boolean(
    await Team.exists({ _id: employee.teamId, companyId, managerId: user.id }),
  );
}

export async function requireManagedMember(user, employeeId, companyId) {
  if (!(await canManageMember(user, employeeId, companyId))) {
    throw new AppError("You can manage only employees in your own teams", 403);
  }
}

export async function serializeTeams(teams) {
  const ids = teams.map((team) => team._id);
  const managers = teams.map((team) => team.managerId);
  const people = await User.find({
    companyId: { $in: [...new Set(teams.map((team) => team.companyId))] },
    $or: [{ teamId: { $in: ids } }, { _id: { $in: managers } }],
  }).select(publicMemberFields);
  return teams.map((team) => ({
    id: String(team._id),
    companyId: team.companyId,
    name: team.name,
    description: team.description || "",
    managerId: String(team.managerId),
    managerName:
      people.find((user) => user.id === String(team.managerId))?.name ||
      "Manager unavailable",
    managerEmail:
      people.find((user) => user.id === String(team.managerId))?.email || "",
    members: people
      .filter((user) => String(user.teamId || "") === String(team._id))
      .map((user) => user.toJSON()),
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
  }));
}
