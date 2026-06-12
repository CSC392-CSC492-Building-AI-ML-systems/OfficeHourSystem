import { getRequestSession, parseSessionUserId } from "@/lib/auth/getRequestSession";
import { prisma } from "@/lib/prisma";
import { updateAttendanceStatus } from "@/lib/queries/update_attendance_status/update-attendance-status";

type UpdateAction = "end" | "no_show";

type UpdateResult =
  | { outcome: "updated"; recordPublicId: string }
  | { outcome: "not_in_help" }
  | { outcome: "not_found" };

export async function updateAttendanceStatusService(
  sessionPublicId: string,
  attendancePublicId: string,
  action: UpdateAction,
): Promise<UpdateResult> {
  // Step 1: Validate cookie, get current user
  const session = await getRequestSession();
  if (!session) throw new Error("Unauthorized");
  const userId = parseSessionUserId(session);

  // Step 2: Find the office hour session
  const ohSession = await prisma.officeHourSession.findUnique({
    where: { publicId: sessionPublicId },
    select: { id: true, offeringId: true },
  });
  if (!ohSession) throw new Error("Session not found");

  // Step 3: Check the user is a TA or INSTRUCTOR in this offering
  const member = await prisma.offeringMember.findUnique({
    where: {
      userId_offeringId: {
        userId,
        offeringId: ohSession.offeringId,
      },
    },
    select: { role: true },
  });
  if (!member || member.role === "STUDENT") {
    throw new Error("Forbidden: only TAs and instructors can update attendance");
  }

  // Step 3b/4: Look up the session host record (used to log who resolved the
  // student) and the attendance record in parallel, since neither depends on
  // the other.
  const [sessionHost, attendance] = await Promise.all([
    prisma.officeHourSessionHost.findUnique({
      where: {
        sessionId_userId: {
          sessionId: ohSession.id,
          userId,
        },
      },
      select: { id: true },
    }),
    prisma.officeHourAttendance.findUnique({
      where: { publicId: attendancePublicId },
      select: { id: true, sessionId: true },
    }),
  ]);

  if (!attendance || attendance.sessionId !== ohSession.id) {
    return { outcome: "not_found" };
  }

  // Step 5: Run the update inside a transaction (insert record + delete attendance)
  const recordPublicId = await updateAttendanceStatus(
    attendance.id,
    action,
    sessionHost?.id ?? null,
  );

  if (recordPublicId === null) {
    return { outcome: "not_in_help" };
  }

  return { outcome: "updated", recordPublicId };
}
