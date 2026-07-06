import { Router } from "express";
import {
  createUser,
  createUserSchema,
  getUser,
  idParamSchema,
  listUsers,
  listUsersSchema,
  removeUser,
  updateUser,
  updateUserSchema,
} from "../controllers/users.controller.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

export const usersRoutes = Router();

usersRoutes.use(requireAuth);
usersRoutes.get("/", allowRoles("hr", "team-manager", "super-admin"), validate(listUsersSchema), listUsers);
usersRoutes.post("/", allowRoles("hr", "super-admin"), validate(createUserSchema), createUser);
usersRoutes.get("/:id", validate(idParamSchema), getUser);
usersRoutes.patch("/:id", validate(updateUserSchema), updateUser);
usersRoutes.delete("/:id", allowRoles("hr", "super-admin"), validate(idParamSchema), removeUser);
