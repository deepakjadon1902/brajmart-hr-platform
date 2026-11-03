import { AppError } from "../utils/AppError.js";

export const MINIMUM_ATTENDANCE_MS = 30 * 60 * 1000;

export function attendanceCheckInTime(record) {
  // Existing records store a date and an IST clock time; new records keep exact timestamps.
  return record.checkInAt
    ? new Date(record.checkInAt)
    : new Date(`${record.date}T${record.checkIn}:00+05:30`);
}

export function attendanceCheckout(record, now = new Date()) {
  if (!record.checkIn) throw new AppError("Check in before checking out", 400);
  const checkIn = attendanceCheckInTime(record);
  if (!Number.isFinite(checkIn.getTime())) {
    throw new AppError("Check-in time is invalid. Please contact HR.", 400);
  }
  const remaining = checkIn.getTime() + MINIMUM_ATTENDANCE_MS - now.getTime();
  if (remaining > 0) {
    throw new AppError(
      `Check out is available 30 minutes after check-in. Please wait ${Math.ceil(remaining / 60000)} more minute(s).`,
      400,
    );
  }
  return {
    checkOut: new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).format(now),
    checkOutAt: now,
    hoursWorked: Math.round(((now.getTime() - checkIn.getTime()) / 3600000) * 100) / 100,
  };
}
