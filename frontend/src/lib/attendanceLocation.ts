import type { AttendanceRecord } from "@/types";

export type AttendanceLocation = NonNullable<AttendanceRecord["location"]>;

export function formatAttendanceLocation(location?: AttendanceRecord["location"]) {
  if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) return "-";
  const coordinates = `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
  return location.address ? `${location.address} (${coordinates})` : coordinates;
}

export function attendanceMapUrl(location?: AttendanceRecord["location"]) {
  if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) return "";
  return `https://www.google.com/maps?q=${location.lat},${location.lng}`;
}

export function getCurrentAttendanceLocation() {
  return new Promise<AttendanceLocation>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is unavailable on this device."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => reject(new Error("Location permission is required for check-in.")),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 12000 },
    );
  });
}
