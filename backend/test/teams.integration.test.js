import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import test from "node:test";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.js";
import { env } from "../src/config/env.js";
import { User } from "../src/models/User.js";
import { Team } from "../src/models/Team.js";
import {
  Task,
  Notification,
  AttendanceRecord,
  LeaveRequest,
} from "../src/models/PortalData.js";

test(
  "saved teams, manager boundaries, and employee portal activity",
  { timeout: 180000 },
  async (t) => {
    const suffix = randomUUID().replaceAll("-", "").slice(0, 24);
    const companyId = `team-test-${suffix}`;
    const otherCompany = `other-team-${suffix}`;
    const companies = [companyId, otherCompany];
    let server;
    try {
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
      });
      const makeUser = (name, role = "employee", extra = {}) =>
        User.create({
          name,
          role,
          companyId,
          email: `${name.replaceAll(" ", "-")}-${suffix}@example.test`,
          ...extra,
        });
      const [
        hr,
        manager,
        otherManager,
        employee,
        colleague,
        otherEmployee,
        unassigned,
        replacement,
        inactive,
        foreignEmployee,
        foreignManager,
        superAdmin,
        designated,
      ] = await Promise.all([
        makeUser("HR", "hr"),
        makeUser("Manager One", "team-manager"),
        makeUser("Manager Two", "team-manager"),
        makeUser("Employee One", "employee", {
          salary: 75000,
          bankAccount: "PRIVATE-ACCOUNT",
        }),
        makeUser("Employee Two"),
        makeUser("Employee Three"),
        makeUser("Employee Four"),
        makeUser("Employee Five"),
        makeUser("Inactive", "employee", { status: "inactive" }),
        makeUser("Foreign Employee", "employee", { companyId: otherCompany }),
        makeUser("Foreign Manager", "team-manager", {
          companyId: otherCompany,
        }),
        makeUser("Super Admin", "super-admin"),
        makeUser("Designated", "employee", { designation: "Team Manager" }),
      ]);
      server = createApp().listen(0, "127.0.0.1");
      await once(server, "listening");
      const base = `http://127.0.0.1:${server.address().port}/api/v1`;
      const request = async (
        user,
        path,
        method = "GET",
        body,
        headers = {},
      ) => {
        const token = jwt.sign({ sub: user.id }, env.JWT_ACCESS_SECRET, {
          expiresIn: "10m",
        });
        const response = await fetch(`${base}${path}`, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...headers,
          },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        return { status: response.status, ...(await response.json()) };
      };
      const save = (user, name, memberIds, id, extra = {}) =>
        request(user, `/teams${id ? `/${id}` : ""}`, id ? "PATCH" : "POST", {
          name,
          memberIds,
          ...extra,
        });
      let firstTeam, secondTeam, task, attendance, leave;

      await t.test(
        "a manager starts with an empty team scope and employees cannot create teams",
        async () => {
          assert.deepEqual((await request(manager, "/teams")).data, []);
          assert.deepEqual(
            (await request(manager, "/workspace/tasks")).data,
            [],
          );
          assert.equal(
            (
              await request(manager, "/workspace/tasks", "POST", {
                employeeId: employee.id,
                title: "Not my member",
              })
            ).status,
            403,
          );
          assert.equal((await save(employee, "Unauthorized", [])).status, 403);
        },
      );

      await t.test(
        "creating a team commits its manager and selected members to MongoDB",
        async () => {
          const result = await save(
            manager,
            "Product Team",
            [employee.id, colleague.id],
            null,
            { description: "Product delivery" },
          );
          assert.equal(result.status, 201, result.message);
          firstTeam = result.data;
          assert.equal(firstTeam.managerId, manager.id);
          assert.deepEqual(
            firstTeam.members.map((member) => member.id).sort(),
            [employee.id, colleague.id].sort(),
          );
          assert.equal(
            String((await User.findById(employee.id).lean()).teamId),
            firstTeam.id,
          );
          assert.equal(
            (await Team.findById(firstTeam.id).lean()).name,
            "Product Team",
          );
          const second = await save(otherManager, "Support Team", [
            otherEmployee.id,
          ]);
          assert.equal(second.status, 201, second.message);
          secondTeam = second.data;
        },
      );

      await t.test(
        "employees see their own team and manager without private payroll information",
        async () => {
          const result = await request(employee, "/teams");
          assert.equal(result.data.length, 1);
          assert.equal(result.data[0].managerName, manager.name);
          assert.equal(result.data[0].name, firstTeam.name);
          assert.equal(
            result.data[0].members.find((member) => member.id === employee.id)
              .salary,
            undefined,
          );
          assert.equal(
            result.data[0].members.find((member) => member.id === employee.id)
              .bankAccount,
            undefined,
          );
          assert.deepEqual((await request(unassigned, "/teams")).data, []);
          assert.equal((await request(employee, "/teams/options")).status, 403);
        },
      );

      await t.test(
        "managers see only their own rosters and HR sees all company teams",
        async () => {
          assert.deepEqual(
            (await request(manager, "/teams")).data.map((team) => team.id),
            [firstTeam.id],
          );
          assert.deepEqual(
            (await request(otherManager, "/teams")).data.map((team) => team.id),
            [secondTeam.id],
          );
          assert.equal((await request(hr, "/teams")).data.length, 2);
          const roster = await request(manager, "/users?limit=100");
          assert.deepEqual(
            roster.data.map((member) => member.id).sort(),
            [manager.id, employee.id, colleague.id].sort(),
          );
          assert.equal(
            roster.data.find((member) => member.id === employee.id).bankAccount,
            undefined,
          );
          assert.equal(
            (await request(manager, `/users/${otherEmployee.id}`)).status,
            403,
          );
          assert.equal(
            (await request(manager, `/users/${employee.id}`)).data.salary,
            undefined,
          );
          const options = await request(manager, "/teams/options");
          assert.equal(
            options.data.members.find(
              (member) => member.id === otherEmployee.id,
            ).teamName,
            secondTeam.name,
          );
          assert.equal(
            options.data.members.find((member) => member.id === employee.id)
              .salary,
            undefined,
          );
        },
      );

      await t.test(
        "invalid membership changes fail atomically without taking another manager's employees",
        async () => {
          const before = await Team.countDocuments({ companyId });
          for (const [body, status] of [
            [{ name: "Conflict team", memberIds: [otherEmployee.id] }, 409],
            [{ name: "Foreign team", memberIds: [foreignEmployee.id] }, 400],
            [{ name: "Inactive team", memberIds: [inactive.id] }, 400],
            [
              {
                name: "Duplicate team",
                memberIds: [unassigned.id, unassigned.id],
              },
              400,
            ],
            [
              {
                name: "Other owner",
                memberIds: [],
                managerId: otherManager.id,
              },
              403,
            ],
            [{ name: "Self team", memberIds: [manager.id] }, 400],
          ])
            assert.equal(
              (await request(manager, "/teams", "POST", body)).status,
              status,
            );
          assert.equal(await Team.countDocuments({ companyId }), before);
          assert.equal(
            String((await User.findById(otherEmployee.id).lean()).teamId),
            secondTeam.id,
          );
          assert.equal(
            (await save(otherManager, "Stolen team", [], firstTeam.id)).status,
            403,
          );
          assert.equal(
            (await request(otherManager, `/teams/${firstTeam.id}`, "DELETE"))
              .status,
            404,
          );
        },
      );

      await t.test(
        "concurrent team creation assigns one employee to exactly one team",
        async () => {
          const results = await Promise.all([
            save(manager, "Concurrent A", [unassigned.id]),
            save(otherManager, "Concurrent B", [unassigned.id]),
          ]);
          assert.deepEqual(
            results.map((result) => result.status).sort(),
            [201, 409],
          );
          const winner = results.find((result) => result.status === 201);
          assert.equal(
            String((await User.findById(unassigned.id).lean()).teamId),
            winner.data.id,
          );
          assert.equal(
            await Team.countDocuments({
              companyId,
              name: { $in: ["Concurrent A", "Concurrent B"] },
            }),
            1,
          );
        },
      );

      await t.test(
        "managers assign tasks to their members and employees receive the task notification",
        async () => {
          const result = await request(manager, "/workspace/tasks", "POST", {
            employeeId: employee.id,
            title: "Team delivery",
            dueDate: "2035-01-15",
            dueTime: "17:00",
          });
          assert.equal(result.status, 201, result.message);
          task = result.data;
          assert.equal(task.assignedById, manager.id);
          assert.equal(
            await Notification.countDocuments({
              companyId,
              taskId: task.id,
              employeeId: employee.id,
              event: "task-assigned",
            }),
            1,
          );
          assert.equal(
            (
              await request(manager, "/workspace/tasks", "POST", {
                employeeId: otherEmployee.id,
                title: "Outside team",
              })
            ).status,
            403,
          );
          assert.equal(
            (
              await request(
                otherManager,
                `/workspace/tasks/${task.id}`,
                "PATCH",
                { status: "completed" },
              )
            ).status,
            404,
          );
          assert.ok(
            !(await request(otherManager, "/workspace/tasks")).data.some(
              (item) => item.id === task.id,
            ),
          );
          const updated = await request(
            employee,
            `/workspace/tasks/${task.id}`,
            "PATCH",
            { status: "in-progress" },
          );
          assert.equal(updated.status, 200);
          assert.equal(
            (await request(manager, "/workspace/tasks")).data.find(
              (item) => item.id === task.id,
            ).status,
            "in-progress",
          );
          assert.equal(
            (
              await request(manager, `/workspace/tasks/${task.id}`, "PATCH", {
                employeeId: otherEmployee.id,
              })
            ).status,
            403,
          );
        },
      );

      await t.test(
        "employee attendance is visible only to its respective manager",
        async () => {
          const result = await request(
            employee,
            "/workspace/attendance",
            "POST",
            {
              employeeId: otherEmployee.id,
              status: "present",
              checkIn: "09:00",
            },
          );
          assert.equal(result.status, 201);
          attendance = result.data;
          assert.equal(attendance.employeeId, employee.id);
          await request(otherEmployee, "/workspace/attendance", "POST", {
            status: "present",
            checkIn: "09:15",
          });
          const records = await request(manager, "/workspace/attendance");
          assert.ok(records.data.some((record) => record.id === attendance.id));
          assert.ok(
            !records.data.some(
              (record) => record.employeeId === otherEmployee.id,
            ),
          );
          assert.equal(
            (
              await request(
                manager,
                `/workspace/attendance/${attendance.id}`,
                "PATCH",
                { status: "absent" },
              )
            ).status,
            403,
          );
          assert.equal(
            (
              await request(
                otherEmployee,
                `/workspace/attendance/${attendance.id}`,
                "PATCH",
                { checkOut: "18:00" },
              )
            ).status,
            403,
          );
        },
      );

      await t.test(
        "a manager reviews only their members' pending leave and the employee sees the result",
        async () => {
          const result = await request(employee, "/workspace/leaves", "POST", {
            employeeId: otherEmployee.id,
            type: "casual",
            from: "2035-01-20",
            to: "2035-01-21",
            reason: "Family event",
            status: "approved",
          });
          assert.equal(result.status, 201);
          leave = result.data;
          assert.equal(leave.employeeId, employee.id);
          assert.equal(leave.status, "pending");
          const other = await request(
            otherEmployee,
            "/workspace/leaves",
            "POST",
            {
              type: "sick",
              from: "2035-01-20",
              to: "2035-01-20",
              reason: "Rest",
            },
          );
          assert.ok(
            !(await request(manager, "/workspace/leaves")).data.some(
              (record) => record.id === other.data.id,
            ),
          );
          assert.equal(
            (
              await request(
                otherManager,
                `/workspace/leaves/${leave.id}`,
                "PATCH",
                { status: "approved" },
              )
            ).status,
            404,
          );
          assert.equal(
            (
              await request(
                employee,
                `/workspace/leaves/${leave.id}`,
                "PATCH",
                { status: "approved" },
              )
            ).status,
            403,
          );
          const approved = await request(
            manager,
            `/workspace/leaves/${leave.id}`,
            "PATCH",
            { status: "approved" },
          );
          assert.equal(approved.status, 200, approved.message);
          assert.equal(approved.data.reviewedById, manager.id);
          assert.equal(
            (await request(employee, "/workspace/leaves")).data.find(
              (record) => record.id === leave.id,
            ).status,
            "approved",
          );
          assert.equal(
            (
              await request(manager, `/workspace/leaves/${leave.id}`, "PATCH", {
                status: "rejected",
              })
            ).status,
            409,
          );
          assert.equal(
            (
              await request(
                otherManager,
                `/workspace/leaves/${other.data.id}`,
                "PATCH",
                { status: "rejected" },
              )
            ).status,
            200,
          );
        },
      );

      await t.test(
        "managers can mark personal attendance and apply for leave without approving themselves",
        async () => {
          const ownAttendance = await request(
            manager,
            "/workspace/attendance",
            "POST",
            { employeeId: employee.id, status: "present" },
          );
          assert.equal(ownAttendance.status, 201);
          assert.equal(ownAttendance.data.employeeId, manager.id);
          const ownLeave = await request(manager, "/workspace/leaves", "POST", {
            type: "casual",
            from: "2035-02-01",
            to: "2035-02-01",
            reason: "Personal",
          });
          assert.equal(ownLeave.status, 201);
          assert.equal(
            (
              await request(
                manager,
                `/workspace/leaves/${ownLeave.data.id}`,
                "PATCH",
                { status: "approved" },
              )
            ).status,
            403,
          );
          assert.equal(
            (
              await request(
                hr,
                `/workspace/leaves/${ownLeave.data.id}`,
                "PATCH",
                { status: "approved" },
              )
            ).status,
            200,
          );
        },
      );

      await t.test(
        "editing a team updates employee membership and removes the old manager's access",
        async () => {
          const updated = await save(
            manager,
            "Product Team Updated",
            [colleague.id, replacement.id],
            firstTeam.id,
          );
          assert.equal(updated.status, 200, updated.message);
          assert.equal(
            (await User.findById(employee.id).lean()).teamId,
            undefined,
          );
          assert.deepEqual((await request(employee, "/teams")).data, []);
          assert.equal(
            (
              await request(manager, `/workspace/tasks/${task.id}`, "PATCH", {
                status: "completed",
              })
            ).status,
            404,
          );
          assert.ok(
            !(await request(manager, "/workspace/attendance")).data.some(
              (record) => record.id === attendance.id,
            ),
          );
          assert.ok(
            (await request(employee, "/workspace/tasks")).data.some(
              (record) => record.id === task.id,
            ),
          );
          const moved = await save(
            otherManager,
            "Support Team",
            [otherEmployee.id, employee.id],
            secondTeam.id,
          );
          assert.equal(moved.status, 200, moved.message);
          assert.equal(
            (await request(employee, "/teams")).data[0].managerId,
            otherManager.id,
          );
          assert.ok(
            (await request(otherManager, "/workspace/tasks")).data.some(
              (record) => record.id === task.id,
            ),
          );
          assert.ok(
            (await request(otherManager, "/workspace/leaves")).data.some(
              (record) => record.id === leave.id,
            ),
          );
        },
      );

      await t.test(
        "HR can change a team's manager and the reporting relationship follows the team",
        async () => {
          const changed = await save(
            hr,
            "Product Team Updated",
            [colleague.id, replacement.id],
            firstTeam.id,
            { managerId: otherManager.id },
          );
          assert.equal(changed.status, 200, changed.message);
          assert.equal(
            (await request(colleague, "/teams")).data[0].managerName,
            otherManager.name,
          );
          assert.equal(
            (
              await request(manager, "/workspace/tasks", "POST", {
                employeeId: colleague.id,
                title: "Old manager",
              })
            ).status,
            403,
          );
          assert.equal(
            (
              await request(otherManager, "/workspace/tasks", "POST", {
                employeeId: colleague.id,
                title: "New manager",
              })
            ).status,
            201,
          );
        },
      );

      await t.test(
        "deleting a team releases members while preserving their work and HR visibility",
        async () => {
          assert.equal(
            (await request(otherManager, `/teams/${secondTeam.id}`, "DELETE"))
              .status,
            200,
          );
          assert.equal(
            (await User.findById(employee.id).lean()).teamId,
            undefined,
          );
          assert.ok(await Task.findById(task.id));
          assert.ok(await AttendanceRecord.findById(attendance.id));
          assert.ok(await LeaveRequest.findById(leave.id));
          assert.ok(
            (await request(hr, "/workspace/tasks")).data.some(
              (record) => record.id === task.id,
            ),
          );
        },
      );

      await t.test(
        "employees cannot grant themselves manager access through their designation",
        async () => {
          const result = await request(
            employee,
            `/users/${employee.id}`,
            "PATCH",
            { designation: "Team Manager" },
          );
          assert.equal(result.status, 403);
          assert.equal(
            (await save(employee, "Self granted team", [])).status,
            403,
          );
          const approved = await request(hr, `/users/${employee.id}`, "PATCH", {
            designation: "Team Manager",
          });
          assert.equal(approved.status, 200);
          assert.equal(
            (await save(employee, "HR granted team", [])).status,
            201,
          );
          assert.equal(
            (await save(designated, "Designated manager team", [])).status,
            201,
          );
        },
      );

      await t.test(
        "only a super admin can manage teams in another selected company",
        async () => {
          const result = await request(
            superAdmin,
            "/teams",
            "POST",
            {
              name: "Other company team",
              managerId: foreignManager.id,
              memberIds: [foreignEmployee.id],
            },
            { "X-Company-Id": otherCompany },
          );
          assert.equal(result.status, 201, result.message);
          assert.equal(result.data.companyId, otherCompany);
          assert.equal(
            (await request(foreignEmployee, "/teams")).data[0].name,
            result.data.name,
          );
          assert.ok(
            !(await request(hr, "/teams")).data.some(
              (team) => team.id === result.data.id,
            ),
          );
        },
      );

      await t.test(
        "moving an employee to another company clears the previous team membership",
        async () => {
          const moved = await request(
            superAdmin,
            `/users/${replacement.id}`,
            "PATCH",
            { companyId: otherCompany },
          );
          assert.equal(moved.status, 200, moved.message);
          assert.equal(
            (await User.findById(replacement.id).lean()).teamId,
            undefined,
          );
          assert.deepEqual((await request(replacement, "/teams")).data, []);
          assert.ok(
            !(await request(hr, "/teams")).data.some((team) =>
              team.members.some((member) => member.id === replacement.id),
            ),
          );
        },
      );
    } finally {
      if (server) await new Promise((resolve) => server.close(resolve));
      if (mongoose.connection.readyState === 1) {
        for (const model of [
          Notification,
          Task,
          AttendanceRecord,
          LeaveRequest,
          Team,
          User,
        ])
          await model.deleteMany({ companyId: { $in: companies } });
      }
      await mongoose.disconnect();
    }
  },
);
