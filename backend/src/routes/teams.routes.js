import { Router } from "express";
import { requireAuth, allowRoles } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  listTeams,
  teamOptions,
  createTeam,
  updateTeam,
  deleteTeam,
  createTeamSchema,
  updateTeamSchema,
  teamIdSchema,
} from "../controllers/teams.controller.js";

export const teamsRoutes = Router();
teamsRoutes.use(requireAuth);
teamsRoutes.get("/", listTeams);
teamsRoutes.get("/options", allowRoles("team-manager"), teamOptions);
teamsRoutes.post(
  "/",
  allowRoles("team-manager"),
  validate(createTeamSchema),
  createTeam,
);
teamsRoutes.patch(
  "/:id",
  allowRoles("team-manager"),
  validate(updateTeamSchema),
  updateTeam,
);
teamsRoutes.delete(
  "/:id",
  allowRoles("team-manager"),
  validate(teamIdSchema),
  deleteTeam,
);
