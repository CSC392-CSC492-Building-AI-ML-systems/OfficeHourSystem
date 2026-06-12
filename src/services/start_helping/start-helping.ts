import { getRequestSession, parseSessionUserId } from "@/lib/auth/getRequestSession";
import { prisma } from "@/lib/prisma";
import { startHelping } from "@/lib/queries/start_helping/start-helping";

type StartHelpingResult =
  | { outcome: "started"; attendancePublicId: string }
  | { outcome: "already_in_help" }
  | { outcome: "not_found" };

export async function startHelpingService(
  sessionPublicId: string,
  attendancePublicId: string,
): Promise<StartHelpingResult> {
  // Step 1: Validate cookie, get current user
  const session = await getRequestSession();
  if (!session) throw new Error("Unauthorized");
  const userId = parseSessionUserId(session);

  // Step 2: Find the office hour session by its public ID
  const ohSession = await prisma.officeHourSession.findUnique({
    where: { publicId: sessionPublicId },
    select: { id: true, offeringId: true },
  });
  if (!ohSession) throw new Error("Session not found");

  // Step 3: Check that this user is a TA or INSTRUCTOR in the offering
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
    throw new Error("Forbidden: only TAs and instructors can start helping");
  }

  // Step 3b: Try to find a registered session host record for this user.
  // Not required — a TA not listed as session host can still help,
  // but helpedByHostId will be null in that case.
  const sessionHost = await prisma.officeHourSessionHost.findUnique({
    where: {
      sessionId_userId: {
        sessionId: ohSession.id,
        userId,
      },
    },
    select: { id: true },
  });

  // Step 4: Look up the attendance record and verify it belongs to this session
  const attendance = await prisma.officeHourAttendance.findUnique({
    where: { publicId: attendancePublicId },
    select: { id: true, sessionId: true },
  });

  if (!attendance || attendance.sessionId !== ohSession.id) {
    return { outcome: "not_found" };
  }

  // Step 5: Atomically move the student from WAITING → IN_HELP
  const updatedPublicId = await startHelping(attendance.id, sessionHost?.id ?? null);

  if (updatedPublicId === null) {
    // count = 0: someone else clicked START on this student a moment ago
    return { outcome: "already_in_help" };
  }

  return { outcome: "started", attendancePublicId: updatedPublicId };
}
