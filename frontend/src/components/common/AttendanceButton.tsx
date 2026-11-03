import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Coffee, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/store";
import { markAttendance } from "@/store/slices/workspaceSlice";
import { checkoutAvailableAt } from "@/lib/attendance";
import { formatAttendanceLocation, getCurrentAttendanceLocation } from "@/lib/attendanceLocation";
import type { AttendanceRecord } from "@/types";

export function AttendanceButton({
  employee,
  record,
  onLocation,
}: {
  employee?: { id: string; name: string } | null;
  record?: AttendanceRecord;
  onLocation: (location: string) => void;
}) {
  const dispatch = useAppDispatch();
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const checkedIn = Boolean(record?.checkIn && !record.checkOut);
  const completed = Boolean(record?.checkOut);
  const availableAt = checkoutAvailableAt(record);
  const remaining = Math.max(0, Math.ceil((availableAt - now) / 1000));
  const invalidTime = checkedIn && !Number.isFinite(availableAt);

  useEffect(() => {
    if (!checkedIn) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [checkedIn]);

  const onCheck = async () => {
    if (!employee || submitting.current || completed || remaining > 0 || invalidTime) return;
    submitting.current = true;
    setBusy(true);
    try {
      const location = checkedIn ? record?.location : await getCurrentAttendanceLocation();
      onLocation(formatAttendanceLocation(location));
      const saved = await dispatch(
        markAttendance({
          employeeId: employee.id,
          employeeName: employee.name,
          location,
          action: checkedIn ? "check-out" : "check-in",
        }),
      ).unwrap();
      setNow(Date.now());
      toast.success(
        saved.checkOut
          ? "Checked out successfully"
          : `Checked in @ ${formatAttendanceLocation(saved.location)}`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update attendance");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        onClick={onCheck}
        className="mt-4 w-full"
        size="lg"
        disabled={!employee || busy || completed || remaining > 0 || invalidTime}
      >
        {busy ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : checkedIn ? (
          <Coffee className="mr-2 h-4 w-4" />
        ) : (
          <CheckCircle2 className="mr-2 h-4 w-4" />
        )}
        {busy
          ? "Saving attendance..."
          : completed
            ? "Attendance complete"
            : checkedIn
              ? "Check Out"
              : "Check In"}
      </Button>
      {checkedIn && (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          Checked in at {record?.checkIn} IST.
          {invalidTime
            ? " Please contact HR to check your check-in time."
            : remaining > 0
              ? ` Check out in ${Math.floor(remaining / 60)}m ${String(remaining % 60).padStart(2, "0")}s (30 minutes after check-in).`
              : " You can check out now."}
        </p>
      )}
      {completed && (
        <p className="mt-3 text-sm text-muted-foreground">Checked out at {record?.checkOut} IST.</p>
      )}
    </>
  );
}
