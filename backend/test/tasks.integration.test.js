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
import { Task, Notification } from "../src/models/PortalData.js";
import {
  syncPendingTaskNotifications,
  taskDeadline,
} from "../src/services/task-notifications.service.js";

// Use isolated companies and remove only this run's fixtures from the configured database.
test(
  "HR assignment and employee task status workflow",
  { timeout: 120000 },
  async (t) => {
    const suffix = randomUUID();
    const companyId = `task-test-${suffix}`;
    const otherCompanyId = `other-${suffix}`;
    const companyIds = [companyId, otherCompanyId];
    let server;

    try {
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
      });
      const makeUser = (name, role, extra = {}) =>
        User.create({
          name,
          email: `${name.toLowerCase().replaceAll(" ", "-")}-${suffix}@example.test`,
          role,
          companyId,
          ...extra,
        });
      const [
        hr,
        employee,
        colleague,
        outsider,
        inactive,
        manager,
        designatedManager,
        superAdmin,
        marketing,
      ] = await Promise.all([
        makeUser("Test HR", "hr"),
        makeUser("Test Employee", "employee"),
        makeUser("Test Colleague", "employee"),
        makeUser("Test Outsider", "employee", { companyId: otherCompanyId }),
        makeUser("Test Inactive", "employee", { status: "inactive" }),
        makeUser("Test Manager", "team-manager"),
        makeUser("Test Designated Manager", "employee", {
          designation: "Team Manager",
        }),
        makeUser("Test Super Admin", "super-admin"),
        makeUser("Test Marketing", "digital-marketing"),
      ]);

      const [managerTeam, designatedTeam] = await Team.create([
        {
          companyId,
          name: "Task test team",
          managerId: manager.id,
          createdById: hr.id,
        },
        {
          companyId,
          name: "Designated manager team",
          managerId: designatedManager.id,
          createdById: hr.id,
        },
      ]);
      await User.updateOne(
        { _id: employee.id },
        { $set: { teamId: managerTeam.id } },
      );
      await User.updateOne(
        { _id: colleague.id },
        { $set: { teamId: designatedTeam.id } },
      );

      server = createApp().listen(0, "127.0.0.1");
      await once(server, "listening");
      const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1/workspace`;
      const request = async (
        user,
        method = "GET",
        path = "",
        body,
        headers = {},
        resource = "tasks",
      ) => {
        const token = jwt.sign({ sub: user.id }, env.JWT_ACCESS_SECRET, {
          expiresIn: "5m",
        });
        const response = await fetch(`${baseUrl}/${resource}${path}`, {
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
      const notifications = (user, method = "GET", path = "", body) =>
        request(user, method, path, body, {}, "notifications");
      let taskId;

      await t.test(
        "HR saves a task and the database stores authoritative assignment details",
        async () => {
          const result = await request(hr, "POST", "", {
            employeeId: employee.id,
            title: "  Prepare monthly report  ",
            description: "Prepare the summary\nand send it to HR.",
            priority: "high",
            dueDate: "2026-11-15",
            companyId: otherCompanyId,
            employeeName: "Spoofed employee",
            assignedById: colleague.id,
            assignedByName: "Spoofed assigner",
            status: "completed",
            completedAt: new Date().toISOString(),
          });
          assert.equal(result.status, 201, result.message);
          taskId = result.data.id;
          assert.equal(result.data.title, "Prepare monthly report");
          assert.equal(result.data.employeeId, employee.id);
          assert.equal(result.data.employeeName, employee.name);
          assert.equal(result.data.assignedById, hr.id);
          assert.equal(result.data.assignedByName, hr.name);
          assert.equal(result.data.companyId, companyId);
          assert.equal(result.data.status, "not-started");
          assert.equal(result.data.completedAt, undefined);
          const stored = await Task.findById(taskId).lean();
          assert.equal(stored.title, result.data.title);
          assert.equal(String(stored.employeeId), employee.id);
          assert.equal(stored.description, result.data.description);
        },
      );

      await t.test(
        "tasks appear for the assignee and HR, and stay hidden from other employees",
        async () => {
          const second = await request(hr, "POST", "", {
            employeeId: colleague.id,
            title: "Colleague task",
          });
          assert.equal(second.status, 201);
          assert.equal(second.data.priority, "medium");
          const own = await request(employee);
          assert.deepEqual(
            own.data.map((task) => task.id),
            [taskId],
          );
          const colleagueTasks = await request(colleague);
          assert.deepEqual(
            colleagueTasks.data.map((task) => task.id),
            [second.data.id],
          );
          const all = await request(hr);
          assert.equal(all.data.length, 2);
          assert.deepEqual((await request(outsider)).data, []);
          assert.equal(
            (
              await request(outsider, "PATCH", `/${taskId}`, {
                status: "completed",
              })
            ).status,
            404,
          );
          assert.equal(
            (
              await request(colleague, "PATCH", `/${taskId}`, {
                status: "completed",
              })
            ).status,
            404,
          );
        },
      );

      await t.test(
        "employee progress persists and HR sees it on a fresh request",
        async () => {
          const progress = await request(employee, "PATCH", `/${taskId}`, {
            status: "in-progress",
          });
          assert.equal(progress.status, 200, progress.message);
          assert.equal(progress.data.status, "in-progress");
          assert.equal(
            (await Task.findById(taskId).lean()).status,
            "in-progress",
          );
          const hrTasks = await request(hr);
          assert.equal(
            hrTasks.data.find((task) => task.id === taskId).status,
            "in-progress",
          );
        },
      );

      await t.test(
        "completion is timestamped, repeat updates preserve it, and reopening clears it",
        async () => {
          const completed = await request(employee, "PATCH", `/${taskId}`, {
            status: "completed",
          });
          assert.equal(completed.status, 200);
          assert.ok(completed.data.completedAt);
          const repeated = await request(employee, "PATCH", `/${taskId}`, {
            status: "completed",
          });
          assert.equal(repeated.data.completedAt, completed.data.completedAt);
          const reopened = await request(employee, "PATCH", `/${taskId}`, {
            status: "not-started",
          });
          assert.equal(reopened.status, 200);
          assert.equal(reopened.data.completedAt, undefined);
          assert.equal(
            (await Task.findById(taskId).lean()).completedAt,
            undefined,
          );
        },
      );

      await t.test(
        "employees cannot create, delete, reassign, or edit task details",
        async () => {
          assert.equal(
            (
              await request(employee, "POST", "", {
                employeeId: employee.id,
                title: "Unauthorized",
              })
            ).status,
            403,
          );
          assert.equal(
            (await request(employee, "DELETE", `/${taskId}`)).status,
            403,
          );
          for (const body of [
            { title: "Edited title" },
            { status: "completed", employeeId: colleague.id },
            { status: "completed", assignedById: employee.id },
            { status: "invalid-status" },
            {},
          ]) {
            assert.equal(
              (await request(employee, "PATCH", `/${taskId}`, body)).status,
              400,
            );
          }
          assert.equal(
            (await Task.findById(taskId).lean()).status,
            "not-started",
          );
        },
      );

      await t.test(
        "invalid assignments fail without creating database records",
        async () => {
          const before = await Task.countDocuments({ companyId });
          for (const body of [
            { title: "Missing employee" },
            { employeeId: "invalid", title: "Bad ID" },
            { employeeId: employee.id, title: "   " },
            { employeeId: employee.id, title: "x".repeat(181) },
            {
              employeeId: employee.id,
              title: "Bad priority",
              priority: "urgent",
            },
            {
              employeeId: employee.id,
              title: "Bad date",
              dueDate: "2026-02-30",
            },
            {
              employeeId: employee.id,
              title: "Bad time",
              dueDate: "2035-01-15",
              dueTime: "25:00",
            },
            {
              employeeId: employee.id,
              title: "Missing date",
              dueTime: "17:30",
            },
            {
              employeeId: employee.id,
              title: "Bad description",
              description: "x".repeat(2001),
            },
          ]) {
            assert.equal((await request(hr, "POST", "", body)).status, 400);
          }
          for (const employeeId of [
            inactive.id,
            outsider.id,
            new mongoose.Types.ObjectId().toString(),
          ]) {
            assert.equal(
              (
                await request(hr, "POST", "", {
                  employeeId,
                  title: "Invalid employee",
                })
              ).status,
              404,
            );
          }
          assert.equal(
            (
              await request(hr, "POST", "", {
                employeeId: marketing.id,
                title: "No employee portal access",
              })
            ).status,
            400,
          );
          assert.equal(await Task.countDocuments({ companyId }), before);
        },
      );

      await t.test(
        "managers can assign and HR reassignment uses the actual employee name",
        async () => {
          for (const [assigningUser, assignee] of [
            [manager, employee],
            [designatedManager, colleague],
          ]) {
            const created = await request(assigningUser, "POST", "", {
              employeeId: assignee.id,
              title: "Manager task",
              dueDate: "",
            });
            assert.equal(created.status, 201, created.message);
            assert.equal(created.data.assignedById, assigningUser.id);
            const updated = await request(
              assigningUser,
              "PATCH",
              `/${created.data.id}`,
              { status: "in-progress" },
            );
            assert.equal(updated.status, 200);
          }
          const changed = await request(hr, "PATCH", `/${taskId}`, {
            employeeId: colleague.id,
          });
          assert.equal(changed.status, 200);
          assert.equal(changed.data.employeeName, colleague.name);
          assert.ok(
            !(await request(employee)).data.some((task) => task.id === taskId),
          );
          assert.ok(
            (await request(colleague)).data.some((task) => task.id === taskId),
          );
          assert.equal(
            (
              await request(hr, "PATCH", `/${taskId}`, {
                assignedByName: "Spoofed",
              })
            ).status,
            400,
          );
          assert.equal(
            (
              await request(hr, "PATCH", `/${taskId}`, {
                employeeId: outsider.id,
              })
            ).status,
            404,
          );
        },
      );

      await t.test(
        "only super admins can select another company for assignment",
        async () => {
          const headers = { "X-Company-Id": otherCompanyId };
          const forbidden = await request(
            hr,
            "POST",
            "",
            { employeeId: outsider.id, title: "Wrong company" },
            headers,
          );
          assert.equal(forbidden.status, 404);
          const created = await request(
            superAdmin,
            "POST",
            "",
            { employeeId: outsider.id, title: "Cross-company admin task" },
            headers,
          );
          assert.equal(created.status, 201, created.message);
          assert.equal(created.data.companyId, otherCompanyId);
          assert.ok(
            (await request(outsider)).data.some(
              (task) => task.id === created.data.id,
            ),
          );
          assert.ok(
            !(await request(hr)).data.some(
              (task) => task.id === created.data.id,
            ),
          );
        },
      );

      await t.test("HR can remove a task and deletion persists", async () => {
        assert.equal((await request(hr, "DELETE", `/${taskId}`)).status, 200);
        assert.equal(await Task.findById(taskId), null);
        assert.equal(await Notification.countDocuments({ taskId }), 0);
      });

      let reminderTask;
      const deadline = new Date("2035-01-15T12:00:00.000Z");
      await t.test(
        "assignment notifications persist with the correct date, time, and recipient",
        async () => {
          const created = await request(hr, "POST", "", {
            employeeId: employee.id,
            title: "Deadline reminder test",
            dueDate: "2035-01-15",
            dueTime: "17:30",
          });
          assert.equal(created.status, 201, created.message);
          reminderTask = created.data;
          assert.equal(reminderTask.dueAt, deadline.toISOString());
          const assigned = await Notification.findOne({
            taskId: reminderTask.id,
            event: "task-assigned",
          }).lean();
          assert.ok(assigned);
          assert.equal(String(assigned.employeeId), employee.id);
          assert.equal(assigned.read, false);
          assert.match(assigned.body, /5:30\s*pm IST/i);
          const own = await notifications(employee);
          assert.equal(own.status, 200);
          assert.ok(own.data.some((item) => item.id === String(assigned._id)));
          for (const user of [colleague, outsider, hr]) {
            assert.ok(
              !(await notifications(user)).data.some(
                (item) => item.taskId === reminderTask.id,
              ),
            );
          }
        },
      );

      await t.test(
        "one-day reminders are generated once even with concurrent workers",
        async () => {
          const scope = { companyId, _id: reminderTask.id };
          await syncPendingTaskNotifications(
            scope,
            new Date(deadline.getTime() - 25 * 60 * 60 * 1000),
          );
          assert.equal(
            await Notification.countDocuments({
              taskId: reminderTask.id,
              event: "task-due-day",
            }),
            0,
          );
          const now = new Date(deadline.getTime() - 24 * 60 * 60 * 1000);
          await Promise.all([
            syncPendingTaskNotifications(scope, now),
            syncPendingTaskNotifications(scope, now),
          ]);
          assert.equal(
            await Notification.countDocuments({
              taskId: reminderTask.id,
              event: "task-due-day",
            }),
            1,
          );
        },
      );

      await t.test(
        "one-hour and deadline reminders persist without duplicate delivery",
        async () => {
          const scope = { companyId, _id: reminderTask.id };
          await syncPendingTaskNotifications(
            scope,
            new Date(deadline.getTime() - 60 * 60 * 1000),
          );
          await syncPendingTaskNotifications(
            scope,
            new Date(deadline.getTime() - 30 * 60 * 1000),
          );
          assert.equal(
            await Notification.countDocuments({
              taskId: reminderTask.id,
              event: "task-due-hour",
            }),
            1,
          );
          await syncPendingTaskNotifications(scope, deadline);
          await syncPendingTaskNotifications(
            scope,
            new Date(deadline.getTime() + 24 * 60 * 60 * 1000),
          );
          assert.equal(
            await Notification.countDocuments({
              taskId: reminderTask.id,
              event: "task-overdue",
            }),
            1,
          );
        },
      );

      await t.test(
        "employees can mark only their own notification as read",
        async () => {
          const assigned = await Notification.findOne({
            taskId: reminderTask.id,
            event: "task-assigned",
          });
          assert.equal(
            (
              await notifications(colleague, "PATCH", `/${assigned.id}`, {
                read: true,
              })
            ).status,
            404,
          );
          assert.equal(
            (
              await notifications(employee, "PATCH", `/${assigned.id}`, {
                read: true,
                title: "Changed",
              })
            ).status,
            400,
          );
          const read = await notifications(
            employee,
            "PATCH",
            `/${assigned.id}`,
            { read: true },
          );
          assert.equal(read.status, 200);
          assert.equal(read.data.read, true);
          assert.equal(
            (await Notification.findById(assigned.id).lean()).read,
            true,
          );
          await syncPendingTaskNotifications(
            { companyId, _id: reminderTask.id },
            deadline,
          );
          assert.equal(
            (await Notification.findById(assigned.id).lean()).read,
            true,
          );
        },
      );

      await t.test(
        "completed tasks stop reminders and existing reminders become read",
        async () => {
          const completed = await request(
            employee,
            "PATCH",
            `/${reminderTask.id}`,
            { status: "completed" },
          );
          assert.equal(completed.status, 200);
          assert.equal(
            await Notification.countDocuments({
              taskId: reminderTask.id,
              event: { $ne: "task-assigned" },
              read: false,
            }),
            0,
          );
          const count = await Notification.countDocuments({
            taskId: reminderTask.id,
          });
          await syncPendingTaskNotifications(
            { companyId, _id: reminderTask.id },
            new Date(deadline.getTime() + 1000),
          );
          assert.equal(
            await Notification.countDocuments({ taskId: reminderTask.id }),
            count,
          );
        },
      );

      await t.test(
        "rescheduling replaces stale reminders and reassignment notifies only the new employee",
        async () => {
          await request(hr, "PATCH", `/${reminderTask.id}`, {
            status: "not-started",
            dueTime: "18:30",
          });
          assert.equal(
            await Notification.countDocuments({
              taskId: reminderTask.id,
              event: { $ne: "task-assigned" },
            }),
            0,
          );
          const newDeadline = new Date(deadline.getTime() + 60 * 60 * 1000);
          await syncPendingTaskNotifications(
            { companyId, _id: reminderTask.id },
            new Date(newDeadline.getTime() - 60 * 60 * 1000),
          );
          const reminder = await Notification.findOne({
            taskId: reminderTask.id,
            event: "task-due-hour",
          }).lean();
          assert.equal(
            reminder.deadlineAt.toISOString(),
            newDeadline.toISOString(),
          );
          const original = await Notification.findOne({
            taskId: reminderTask.id,
            event: "task-assigned",
          });
          await request(hr, "PATCH", `/${reminderTask.id}`, {
            employeeId: colleague.id,
          });
          assert.equal(
            await Notification.countDocuments({
              taskId: reminderTask.id,
              employeeId: employee.id,
            }),
            0,
          );
          assert.equal(
            await Notification.countDocuments({
              taskId: reminderTask.id,
              employeeId: colleague.id,
              event: "task-assigned",
              read: false,
            }),
            1,
          );
          await request(hr, "PATCH", `/${reminderTask.id}`, {
            employeeId: employee.id,
          });
          const reassigned = await Notification.findOne({
            taskId: reminderTask.id,
            event: "task-assigned",
          });
          assert.notEqual(reassigned.id, original.id);
          assert.equal(String(reassigned.employeeId), employee.id);
        },
      );

      await t.test(
        "tasks with only a date use 11:59 PM IST and undated tasks have no reminders",
        async () => {
          assert.equal(
            taskDeadline({ dueDate: "2035-01-15" }).toISOString(),
            "2035-01-15T18:29:00.000Z",
          );
          const created = await request(hr, "POST", "", {
            employeeId: employee.id,
            title: "No deadline",
          });
          assert.equal(created.status, 201);
          await syncPendingTaskNotifications(
            { companyId, _id: created.data.id },
            deadline,
          );
          assert.equal(
            await Notification.countDocuments({
              taskId: created.data.id,
              event: { $ne: "task-assigned" },
            }),
            0,
          );
        },
      );

      await t.test(
        "notification reads recover pending assignment delivery after a server restart",
        async () => {
          const task = await Task.create({
            companyId,
            employeeId: employee.id,
            employeeName: employee.name,
            title: "Retry assignment",
            assignedById: hr.id,
            assignedByName: hr.name,
          });
          assert.equal(
            await Notification.countDocuments({ taskId: task.id }),
            0,
          );
          const inbox = await notifications(employee);
          assert.equal(inbox.status, 200);
          assert.ok(
            inbox.data.some(
              (item) =>
                item.taskId === task.id && item.event === "task-assigned",
            ),
          );
          assert.equal(
            (await Task.findById(task.id).lean()).assignmentNotified,
            true,
          );
        },
      );
    } finally {
      if (server) await new Promise((resolve) => server.close(resolve));
      if (mongoose.connection.readyState === 1) {
        await Team.deleteMany({ companyId: { $in: companyIds } });
        await Notification.deleteMany({ companyId: { $in: companyIds } });
        await Task.deleteMany({ companyId: { $in: companyIds } });
        await User.deleteMany({ companyId: { $in: companyIds } });
      }
      await mongoose.disconnect();
    }
  },
);
