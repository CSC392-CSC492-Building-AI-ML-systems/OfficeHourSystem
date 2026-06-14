import { prisma } from "@/lib/prisma";

type UpdateAction = "end" | "no_show";

/**
 * Resolve a student's attendance:
 *   "end"     → outcome COMPLETED, helpEndedAt = now
 *   "no_show" → outcome NO_SHOW,   helpEndedAt left null
 *
 * Uses a transaction so the record insert and attendance delete are atomic —
 * either both succeed or neither does.
 *
 * Returns the new record's publicId, or null if the student was not IN_HELP.
 */
export async function updateAttendanceStatus(
  attendanceId: number,
  action: UpdateAction,
  sessionHostId: number | null,
): Promise<string | null> {
  return prisma.$transaction(async (tx) => {
    // Find the attendance — must be IN_HELP to proceed
    const attendance = await tx.officeHourAttendance.findUnique({
      where: { id: attendanceId },
    });

    if (!attendance || attendance.status !== "IN_HELP") {
      return null;
    }

    // Write the permanent history record
    const record = await tx.officeHourAttendanceRecord.create({
      data: {
        sessionId:     attendance.sessionId,
        studentId:     attendance.studentId,
        helpedByHostId: sessionHostId,
        checkedInAt:   attendance.checkedInAt,
        helpStartedAt: attendance.helpStartedAt,
        helpEndedAt:   action === "end" ? new Date() : null,
        outcome:       action === "end" ? "COMPLETED" : "NO_SHOW",
      },
    });

    // Remove the student from the active queue
    await tx.officeHourAttendance.delete({
      where: { id: attendanceId },
    });

    return record.publicId;
  });
}
