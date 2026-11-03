import assert from "node:assert/strict";
import test from "node:test";
import { attendanceCheckout } from "../src/services/attendance.service.js";

const record = {
  date: "2026-11-03", checkIn: "09:00", checkInAt: new Date("2026-11-03T03:30:45.000Z"),
};

test("checkout is blocked until exactly 30 minutes after the recorded check-in", () => {
  assert.throws(() => attendanceCheckout(record, new Date("2026-11-03T04:00:44.999Z")), /30 minutes/);
  const result = attendanceCheckout(record, new Date("2026-11-03T04:00:45.000Z"));
  assert.equal(result.hoursWorked, 0.5);
  assert.equal(result.checkOut, "09:30");
});

test("historical records use their saved date and IST time", () => {
  const legacy = { date: "2026-11-03", checkIn: "09:00" };
  assert.throws(() => attendanceCheckout(legacy, new Date("2026-11-03T03:59:59Z")), /30 minutes/);
  assert.equal(attendanceCheckout(legacy, new Date("2026-11-03T04:00:00Z")).hoursWorked, 0.5);
});

test("checkout works across midnight and records the real elapsed hours", () => {
  const overnight = { date: "2026-11-03", checkIn: "23:50" };
  assert.throws(() => attendanceCheckout(overnight, new Date("2026-11-03T18:49:59Z")), /30 minutes/);
  const result = attendanceCheckout(overnight, new Date("2026-11-03T18:50:00Z"));
  assert.equal(result.checkOut, "00:20");
  assert.equal(result.hoursWorked, 0.5);
});

test("missing or invalid check-in times cannot silently bypass the minimum duration", () => {
  assert.throws(() => attendanceCheckout({ date: "2026-11-03" }), /Check in before/);
  assert.throws(() => attendanceCheckout({ date: "2026-11-03", checkIn: "invalid" }), /invalid/);
});
