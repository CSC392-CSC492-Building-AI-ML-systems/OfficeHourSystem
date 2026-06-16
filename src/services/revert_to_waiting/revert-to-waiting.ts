import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { prisma } from "@/lib/prisma";
import { getActiveOfferingMembership } from "@/lib/queries/offeringMember";
import { revertToWaiting } from "@/lib/queries/revert_to_waiting/revert-to-waiting";

type RevertResult =
  | { outcome: "reverted"; attendancePublicId: string }
  | { outcome: "not_in_help" }
  | { outcome: "not_found" };

export async function revertToWaitingService(
  sessionPublicId: string,
  attendancePublicId: string,
): Promise<RevertResult> {
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
  const member = await getActiveOfferingMembership(
    userId,
    ohSession.offeringId,
  );
  if (!member || member.role === "STUDENT") {
    throw new Error("Forbidden: only TAs and instructors can revert a student");
  }

  // Step 4: Look up the attendance and verify it belongs to this session
  const attendance = await prisma.officeHourAttendance.findUnique({
    where: { publicId: attendancePublicId },
    select: { id: true, sessionId: true },
  });

  if (!attendance || attendance.sessionId !== ohSession.id) {
    return { outcome: "not_found" };
  }

  // Step 5: Atomically revert IN_HELP → WAITING
  // The student's original checkedInAt is unchanged, so their queue position is preserved
  const updatedPublicId = await revertToWaiting(attendance.id);

  if (updatedPublicId === null) {
    // Someone else already ended or reverted this student
    return { outcome: "not_in_help" };
  }

  return { outcome: "reverted", attendancePublicId: updatedPublicId };
}
