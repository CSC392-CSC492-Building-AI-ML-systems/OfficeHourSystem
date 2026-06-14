import { prisma } from "@/lib/prisma";

type EndSessionResult = "ended" | "already_ended" | "not_found";

/**
 * End a session and bulk-resolve all remaining attendances in one transaction:
 *   WAITING students  → AttendanceRecord with outcome CANCELLED
 *   IN_HELP students  → AttendanceRecord with outcome COMPLETED, helpEndedAt = null
 *   Session status    → COMPLETED
 *
 * helpEndedAt is intentionally left null for force-ended IN_HELP students
 * so they can be distinguished from normal END HELP records (which set helpEndedAt).
 */
export async function endSession(sessionId: number): Promise<EndSessionResult> {
  // Check current session status before entering the transaction
  const session = await prisma.officeHourSession.findUnique({
    where: { id: sessionId },
    select: { status: true },
  });

  if (!session) return "not_found";
  if (session.status === "COMPLETED") return "already_ended";

  await prisma.$transaction(async (tx) => {
    // Collect all remaining attendances
    const attendances = await tx.officeHourAttendance.findMany({
      where: { sessionId },
      select: {
        sessionId: true,
        studentId: true,
        helpedByHostId: true,
        checkedInAt: true,
        helpStartedAt: true,
        status: true,
      },
    });

    // Write permanent records for WAITING students (CANCELLED outcome)
    const waitingRecords = attendances
      .filter((a) => a.status === "WAITING")
      .map((a) => ({
        sessionId: a.sessionId,
        studentId: a.studentId,
        helpedByHostId: null,
        checkedInAt: a.checkedInAt,
        helpStartedAt: null,
        helpEndedAt: null,
        outcome: "CANCELLED" as const,
      }));

    // Write permanent records for IN_HELP students (COMPLETED outcome, helpEndedAt null)
    const inHelpRecords = attendances
      .filter((a) => a.status === "IN_HELP")
      .map((a) => ({
        sessionId: a.sessionId,
        studentId: a.studentId,
        helpedByHostId: a.helpedByHostId,
        checkedInAt: a.checkedInAt,
        helpStartedAt: a.helpStartedAt,
        helpEndedAt: null,
        outcome: "COMPLETED" as const,
      }));

    if (waitingRecords.length > 0) {
      await tx.officeHourAttendanceRecord.createMany({ data: waitingRecords });
    }

    if (inHelpRecords.length > 0) {
      await tx.officeHourAttendanceRecord.createMany({ data: inHelpRecords });
    }

    // Remove all active attendance rows for this session
    await tx.officeHourAttendance.deleteMany({ where: { sessionId } });

    // Mark the session as COMPLETED
    await tx.officeHourSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED" },
    });
  });

  return "ended";
}
