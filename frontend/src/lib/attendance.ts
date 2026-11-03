import type { AttendanceRecord } from "@/types";
import { todayInIndia } from "@/utils/date";

export function currentAttendance(records: AttendanceRecord[], now = Date.now()) {
  // Keep a recent overnight shift available without reviving old missed checkouts.
  return (
    records.find((record) => record.date === todayInIndia(new Date(now))) ||
    records.find((record) => {
      if (!record.checkIn || record.checkOut) return false;
      const checkIn = new Date(
        record.checkInAt || `${record.date}T${record.checkIn}:00+05:30`,
      ).getTime();
      return checkIn <= now && now - checkIn < 24 * 60 * 60 * 1000;
    })
  );
}

export function checkoutAvailableAt(record?: AttendanceRecord) {
  if (!record?.checkIn || record.checkOut) return 0;
  const checkIn = record.checkInAt || `${record.date}T${record.checkIn}:00+05:30`;
  return new Date(checkIn).getTime() + 30 * 60 * 1000;
}
