import mongoose from "mongoose";
import { z } from "zod";
import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
import {
  isPeopleAdmin,
  publicMemberFields,
  serializeTeams,
} from "../services/teams.service.js";
import { canAccessPortal } from "../utils/portalAccess.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success, created } from "../utils/http.js";

const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Select a valid employee")
  .transform((value) => value.toLowerCase());
const fields = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Team name must contain at least two characters")
      .max(120),
    description: z.string().trim().max(1000).default(""),
    managerId: objectId.optional(),
    memberIds: z
      .array(objectId)
      .max(500)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Select each member only once",
      ),
  })
  .strict();
export const createTeamSchema = z.object({ body: fields });
export const updateTeamSchema = z.object({
  params: z.object({ id: objectId }),
  body: fields,
});
export const teamIdSchema = z.object({ params: z.object({ id: objectId }) });

function companyFor(req) {
  return req.user.role === "super-admin"
    ? String(req.headers["x-company-id"] || req.user.companyId).trim()
    : req.user.companyId;
}

export const listTeams = asyncHandler(async (req, res) => {
  const companyId = isPeopleAdmin(req.user)
    ? companyFor(req)
    : req.user.companyId;
  const filter = { companyId };
  if (!isPeopleAdmin(req.user))
    filter.$or = [
      { managerId: req.user.id },
      ...(req.user.teamId ? [{ _id: req.user.teamId }] : []),
    ];
  const teams = await Team.find(filter).sort({ createdAt: -1 });
  return success(res, await serializeTeams(teams));
});

export const teamOptions = asyncHandler(async (req, res) => {
  const companyId = companyFor(req);
  const [users, teams] = await Promise.all([
    User.find({ companyId }).select(publicMemberFields).sort({ name: 1 }),
    Team.find({ companyId }).select("name managerId"),
  ]);
  const members = users
    .filter((user) => user.role === "employee")
    .map((user) => ({
      ...user.toJSON(),
      teamName:
        teams.find((team) => team.id === String(user.teamId || ""))?.name || "",
    }));
  const managers = isPeopleAdmin(req.user)
    ? users
        .filter(
          (user) =>
            user.status !== "inactive" && canAccessPortal(user, "team-manager"),
        )
        .map((user) => user.toJSON())
    : [req.user.toJSON()].map(({ id, name, email }) => ({ id, name, email }));
  return success(res, { members, managers });
});

async function saveTeam(req, teamId) {
  const companyId = companyFor(req);
  const body = req.validated.body;
  const managerId = body.managerId || req.user.id;
  if (!isPeopleAdmin(req.user) && managerId !== req.user.id)
    throw new AppError("You can create teams only for yourself", 403);
  const id = teamId || new mongoose.Types.ObjectId();
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (teamId) {
        const existing = await Team.findOne({ _id: teamId, companyId }).session(
          session,
        );
        if (!existing) throw new AppError("Team not found", 404);
        if (
          !isPeopleAdmin(req.user) &&
          String(existing.managerId) !== req.user.id
        )
          throw new AppError("You can edit only your own teams", 403);
      }
      const manager = await User.findOne({
        _id: managerId,
        companyId,
        status: { $ne: "inactive" },
      }).session(session);
      if (!manager || !canAccessPortal(manager, "team-manager"))
        throw new AppError(
          "Select an active team manager in this company",
          400,
        );
      if (body.memberIds.includes(managerId))
        throw new AppError(
          "The team manager cannot be selected as their own team member",
          400,
        );
      const members = await User.find({
        _id: { $in: body.memberIds },
        companyId,
        role: "employee",
      }).session(session);
      if (members.length !== body.memberIds.length)
        throw new AppError("Select employees from this company", 400);
      for (const member of members) {
        if (member.teamId && String(member.teamId) !== String(id))
          throw new AppError(
            `${member.name} already belongs to another team. Remove them from that team first.`,
            409,
          );
        if (
          member.status === "inactive" &&
          String(member.teamId || "") !== String(id)
        )
          throw new AppError(
            `${member.name} is inactive and cannot be added`,
            400,
          );
      }
      if (teamId) {
        await Team.updateOne(
          { _id: id, companyId },
          {
            $set: { name: body.name, description: body.description, managerId },
          },
          { session, runValidators: true },
        );
      } else {
        await Team.create(
          [
            {
              _id: id,
              companyId,
              name: body.name,
              description: body.description,
              managerId,
              createdById: req.user.id,
            },
          ],
          { session },
        );
      }
      await User.updateMany(
        { companyId, teamId: id, _id: { $nin: body.memberIds } },
        { $unset: { teamId: 1 } },
        { session },
      );
      await User.updateMany(
        { companyId, _id: { $in: body.memberIds } },
        { $set: { teamId: id } },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }
  return (await serializeTeams([await Team.findById(id)]))[0];
}

export const createTeam = asyncHandler(async (req, res) =>
  created(res, await saveTeam(req)),
);
export const updateTeam = asyncHandler(async (req, res) =>
  success(res, await saveTeam(req, req.validated.params.id)),
);
export const deleteTeam = asyncHandler(async (req, res) => {
  const companyId = companyFor(req);
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const filter = {
        _id: req.validated.params.id,
        companyId,
        ...(!isPeopleAdmin(req.user) ? { managerId: req.user.id } : {}),
      };
      const team = await Team.findOne(filter).session(session);
      if (!team) throw new AppError("Team not found", 404);
      await User.updateMany(
        { companyId, teamId: team._id },
        { $unset: { teamId: 1 } },
        { session },
      );
      await Team.deleteOne(filter, { session });
    });
  } finally {
    await session.endSession();
  }
  return success(res, { id: req.validated.params.id, deleted: true });
});
