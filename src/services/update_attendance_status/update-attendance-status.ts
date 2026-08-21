import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import {
  assertSessionOperator,
  ensureSessionHost,
} from "@/lib/auth/sessionOperator";
import { prisma } from "@/lib/prisma";
import { updateAttendanceStatus } from "@/lib/queries/update_attendance_status/update-attendance-status";
import { revalidateTag } from "next/cache";
import { waitStatsCacheTag } from "@/lib/waitStats";

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
    select: {
      id: true,
      offeringId: true,
      offering: { select: { courseId: true } },
    },
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

  // Step 4b: Record who resolved the student. An instructor who isn't a
  // scheduled host gets a host row created now, so helpedByHostId is never null
  // (needed for academic-offence lookups). role is always set on this path.
  const helperHostId =
    hostId ??
    (await ensureSessionHost(ohSession.id, userId, role ?? "INSTRUCTOR"));

  // Step 5: Run the update inside a transaction (insert record + delete attendance)
  const recordPublicId = await updateAttendanceStatus(
    attendance.id,
    action,
    helperHostId,
  );

  if (recordPublicId === null) {
    return { outcome: "not_in_help" };
  }

  if (action === "end") {
    revalidateTag(waitStatsCacheTag(ohSession.offering.courseId), "max");
  }

  return { outcome: "updated", recordPublicId };
}
