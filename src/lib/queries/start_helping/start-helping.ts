import { prisma } from "@/lib/prisma";

/**
 * Atomically move one WAITING student to IN_HELP.
 *
 * Uses updateMany with a WHERE status = 'WAITING' guard so two concurrent
 * requests can't both start the same student — only one will get count = 1.
 *
 * Returns the updated attendance publicId, or null if the student was already
 * moved (race condition: someone else clicked first).
 */
export async function startHelping(
  attendanceId: number,
  sessionHostId: number | null, // null if the TA is not a registered session host
): Promise<string | null> {
  // Atomic update: only succeeds if the student is still WAITING
  const result = await prisma.officeHourAttendance.updateMany({
    where: {
      id: attendanceId,
      status: "WAITING",
    },
    data: {
      status: "IN_HELP",
      helpStartedAt: new Date(),
      helpedByHostId: sessionHostId,
    },
  });

  // count = 0 means someone else already started this student
  if (result.count === 0) {
    return null;
  }

  // Fetch the publicId to hand back to the caller
  const updated = await prisma.officeHourAttendance.findUnique({
    where: { id: attendanceId },
    select: { publicId: true },
  });

  return updated?.publicId ?? null;
}
