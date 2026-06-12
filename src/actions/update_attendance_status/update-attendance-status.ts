"use server";

import { updateAttendanceStatusService } from "@/services/update_attendance_status/update-attendance-status";

export async function updateAttendanceStatusAction(
  sessionPublicId: string,
  attendancePublicId: string,
  action: "end" | "no_show",
) {
  return updateAttendanceStatusService(sessionPublicId, attendancePublicId, action);
}
