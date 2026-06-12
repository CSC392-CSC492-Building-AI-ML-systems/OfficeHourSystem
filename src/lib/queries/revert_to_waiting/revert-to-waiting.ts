import { prisma } from "@/lib/prisma";

/**
 * Atomically revert one IN_HELP student back to WAITING.
 *
 * Uses updateMany with WHERE status = 'IN_HELP' so concurrent requests
 * can't both revert the same student — only one will get count = 1.
 *
 * Returns the attendance publicId on success, or null if the student
 * was no longer IN_HELP (already reverted or ended by someone else).
 */
export async function revertToWaiting(
  attendanceId: number,
): Promise<string | null> {
  // Atomic update: only succeeds if the student is currently IN_HELP
  const result = await prisma.officeHourAttendance.updateMany({
    where: {
      id: attendanceId,
      status: "IN_HELP",
    },
    data: {
      status: "WAITING",
      helpStartedAt: null,
      helpedByHostId: null,
    },
  });

  // count = 0 means the student was no longer IN_HELP
  if (result.count === 0) {
    return null;
  }

  const updated = await prisma.officeHourAttendance.findUnique({
    where: { id: attendanceId },
    select: { publicId: true },
  });

  return updated?.publicId ?? null;
}
