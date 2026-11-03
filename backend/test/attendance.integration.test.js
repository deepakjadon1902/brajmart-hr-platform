import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import test from "node:test";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.js";
import { env } from "../src/config/env.js";
import { User } from "../src/models/User.js";
import { AttendanceRecord } from "../src/models/PortalData.js";

test("employee attendance and session renewal", { timeout: 90000 }, async (t) => {
  const companyId = `attendance-test-${randomUUID()}`;
  let server;
  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    await AttendanceRecord.init();
    const [employee, colleague, manager, hr] = await User.create([
      { name: "Attendance Employee", role: "employee", companyId, email: `${companyId}@example.test` },
      { name: "Attendance Colleague", role: "employee", companyId, email: `colleague-${companyId}@example.test` },
      { name: "Attendance Manager", role: "team-manager", companyId, email: `manager-${companyId}@example.test` },
      { name: "Attendance HR", role: "hr", companyId, email: `hr-${companyId}@example.test` },
    ]);
    await employee.setPassword("Test-password-123!");
    await employee.save();
    server = createApp().listen(0, "127.0.0.1");
    await once(server, "listening");
    const base = `http://127.0.0.1:${server.address().port}/api/v1`;
    async function request(user, path, method = "GET", body, headers = {}) {
      const token = jwt.sign({ sub: user.id }, env.JWT_ACCESS_SECRET, { expiresIn: "5m" });
      const response = await fetch(`${base}${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...headers },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      return { status: response.status, cookie: response.headers.get("set-cookie"), ...await response.json() };
    }
    let attendance;

    await t.test("simultaneous check-ins save one authoritative attendance record", async () => {
      const results = await Promise.all(Array.from({ length: 4 }, () => request(employee, "/workspace/attendance", "POST", {
        employeeId: colleague.id,
        date: "2000-01-01", checkIn: "00:00", checkInAt: "2000-01-01T00:00:00Z",
        checkOut: "23:59", checkOutAt: "2000-01-01T23:59:00Z", hoursWorked: 24,
        status: "absent", location: { lat: 27.5, lng: 77.7 },
      })));
      for (const result of results) assert.ok([200, 201].includes(result.status), result.message);
      assert.equal(new Set(results.map((result) => result.data.id)).size, 1);
      assert.equal(await AttendanceRecord.countDocuments({ companyId, employeeId: employee.id }), 1);
      attendance = results[0].data;
      assert.equal(attendance.employeeId, employee.id);
      assert.equal(attendance.employeeName, employee.name);
      assert.equal(attendance.status, "present");
      assert.equal(attendance.checkOut, undefined);
      assert.equal(attendance.checkOutAt, undefined);
      assert.equal(attendance.hoursWorked, 0);
      assert.ok(Math.abs(Date.parse(attendance.checkInAt) - Date.now()) < 10000);
    });

    await t.test("editing timestamps cannot bypass early checkout", async () => {
      const result = await request(employee, `/workspace/attendance/${attendance.id}`, "PATCH", {
        checkIn: "00:00", checkInAt: "2000-01-01T00:00:00Z", date: "2000-01-01",
        checkOut: "23:59", checkOutAt: "2099-01-01T23:59:00Z", hoursWorked: 24,
      });
      assert.equal(result.status, 400);
      assert.match(result.message, /30 minutes/);
      const saved = await AttendanceRecord.findById(attendance.id);
      assert.equal(saved.checkOut, undefined);
      assert.equal(saved.checkInAt.toISOString(), attendance.checkInAt);
      assert.equal(saved.hoursWorked, 0);
    });

    await t.test("employees cannot edit check-in or someone else's attendance", async () => {
      assert.equal((await request(employee, `/workspace/attendance/${attendance.id}`, "PATCH", { checkIn: "00:00" })).status, 400);
      assert.equal((await request(colleague, `/workspace/attendance/${attendance.id}`, "PATCH", { checkOut: true })).status, 403);
      assert.equal((await request(manager, `/workspace/attendance/${attendance.id}`, "PATCH", { checkOut: true })).status, 403);
    });

    await t.test("checkout after 30 minutes persists and repeated actions keep the saved result", async () => {
      // Move only this fixture's clock rather than waiting thirty minutes in the test.
      const checkInAt = new Date(Date.now() - 31 * 60000);
      await AttendanceRecord.updateOne({ _id: attendance.id, companyId }, { $set: { checkInAt } });
      const result = await request(employee, `/workspace/attendance/${attendance.id}`, "PATCH", { checkOut: "23:59", hoursWorked: 500 });
      assert.equal(result.status, 200, result.message);
      assert.ok(Math.abs(Date.parse(result.data.checkOutAt) - Date.now()) < 10000);
      assert.ok(result.data.hoursWorked >= 0.51 && result.data.hoursWorked < 0.55);
      assert.equal(result.data.checkInAt, checkInAt.toISOString());
      const repeated = await request(employee, `/workspace/attendance/${attendance.id}`, "PATCH", { checkOut: "00:00" });
      assert.equal(repeated.data.checkOutAt, result.data.checkOutAt);
      const checkInAgain = await request(employee, "/workspace/attendance", "POST", {});
      assert.equal(checkInAgain.data.id, attendance.id);
      assert.equal(checkInAgain.data.checkOutAt, result.data.checkOutAt);
      assert.equal(await AttendanceRecord.countDocuments({ companyId, employeeId: employee.id }), 1);
    });

    await t.test("managers and HR marking personal attendance follow the same 30-minute rule", async () => {
      for (const user of [manager, hr]) {
        const result = await request(user, "/workspace/attendance", "POST", {});
        assert.equal(result.data.employeeId, user.id);
        assert.ok(result.data.checkInAt);
        assert.equal((await request(user, `/workspace/attendance/${result.data.id}`, "PATCH", { checkOut: true })).status, 400);
      }
    });

    await t.test("HR can still correct employee attendance", async () => {
      const result = await request(hr, `/workspace/attendance/${attendance.id}`, "PATCH", { checkIn: "09:00", checkOut: "18:00" });
      assert.equal(result.status, 200);
      assert.equal(result.data.hoursWorked, 9);
    });

    await t.test("old missed checkouts do not block a new check-in or require deleting history", async () => {
      await AttendanceRecord.create([
        { companyId, employeeId: colleague.id, date: "2000-01-01", checkIn: "09:00", status: "present" },
        { companyId, employeeId: colleague.id, date: "2000-01-01", checkIn: "09:01", status: "present" },
      ]);
      const result = await request(colleague, "/workspace/attendance", "POST", {});
      assert.equal(result.status, 201, result.message);
      assert.notEqual(result.data.date, "2000-01-01");
      assert.ok(result.data.checkInAt);
      assert.equal(await AttendanceRecord.countDocuments({ companyId, employeeId: colleague.id, date: "2000-01-01" }), 2);
    });

    await t.test("default login is persistent and refresh rejects deactivated accounts", async () => {
      const result = await request(employee, "/auth/login", "POST", {
        email: employee.email, password: "Test-password-123!", role: "employee",
      });
      assert.equal(result.status, 200, result.message);
      assert.match(result.cookie, /Max-Age=/);
      const renewed = await request(employee, "/auth/refresh", "POST", { remember: true }, { Cookie: result.cookie.split(";")[0] });
      assert.equal(renewed.status, 200, renewed.message);
      assert.equal(renewed.data.user.id, employee.id);
      assert.ok(renewed.data.token);
      await User.updateOne({ _id: employee.id, companyId }, { $set: { status: "inactive" } });
      assert.equal((await request(employee, "/auth/refresh", "POST", {}, { Cookie: renewed.cookie.split(";")[0] })).status, 401);
    });

    await t.test("expired refresh cookies return 401", async () => {
      const token = jwt.sign({ sub: colleague.id }, env.JWT_REFRESH_SECRET, {
        expiresIn: -1, issuer: "brajmart-hr-api", audience: "brajmart-hr-portal",
      });
      const result = await request(colleague, "/auth/refresh", "POST", {}, { Cookie: `refresh_token=${token}` });
      assert.equal(result.status, 401);
      assert.match(result.message, /expired refresh token/);
    });

    await t.test("logout revokes the refresh cookie even with an expired access token", async () => {
      await User.updateOne({ _id: employee.id, companyId }, { $set: { status: "active" } });
      const login = await request(employee, "/auth/login", "POST", {
        email: employee.email, password: "Test-password-123!", role: "employee", remember: true,
      });
      const cookie = login.cookie.split(";")[0];
      const expired = jwt.sign({ sub: employee.id }, env.JWT_ACCESS_SECRET, { expiresIn: -1 });
      const result = await request(employee, "/auth/logout", "POST", {}, { Cookie: cookie, Authorization: `Bearer ${expired}` });
      assert.equal(result.status, 200, result.message);
      assert.match(result.cookie, /refresh_token=;/);
      assert.equal((await request(employee, "/auth/refresh", "POST", {}, { Cookie: cookie })).status, 401);
    });
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState === 1) {
      await Promise.all([AttendanceRecord.deleteMany({ companyId }), User.deleteMany({ companyId })]);
    }
    await mongoose.disconnect();
  }
});
