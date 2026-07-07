import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import {
  assertSessionOperator,
  ensureSessionHost,
} from "@/lib/auth/sessionOperator";
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

  // Step 3: Only the offering's instructor or a host of this session may act
  const { role, hostId } = await assertSessionOperator(
    userId,
    ohSession.id,
    ohSession.offeringId,
  );

  // Step 4: Look up the attendance record
  const attendance = await prisma.officeHourAttendance.findUnique({
    where: { publicId: attendancePublicId },
    select: { id: true, sessionId: true },
  });

  if (!attendance || attendance.sessionId !== ohSession.id) {
    return { outcome: "not_found" };
  }

  // Step 4b: Record who is helping. An instructor who isn't a scheduled host
  // gets a host row created now, so helpedByHostId is never null (needed for
  // academic-offence lookups). role is always set on this path.
  const helperHostId =
    hostId ??
    (await ensureSessionHost(ohSession.id, userId, role ?? "INSTRUCTOR"));

  // Step 5: Atomically move the student from WAITING → IN_HELP
  const updatedPublicId = await startHelping(attendance.id, helperHostId);

  if (updatedPublicId === null) {
    // count = 0: someone else clicked START on this student a moment ago
    return { outcome: "already_in_help" };
  }

  return { outcome: "started", attendancePublicId: updatedPublicId };
}
