import { prisma } from "@/lib/prisma";
import type { ActiveQueueDto } from "@/lib/types/queue";

// Get the full queue state for a session:
// - all WAITING students ordered by check-in time (earliest = rank 1)
// - all IN_HELP students (no rank)
//
// sessionStatus/endsAt are passed in by the caller (already fetched alongside
// the auth check) so this function only needs one query for the attendances.
export async function getActiveQueue(
  sessionId: number,
  sessionStatus: ActiveQueueDto["sessionStatus"],
  endsAt: Date,
): Promise<ActiveQueueDto> {
  // Fetch WAITING and IN_HELP attendances in one query, ordered by check-in
  // time so the WAITING subset is already in rank order.
  const rows = await prisma.officeHourAttendance.findMany({
    where: {
      sessionId: sessionId,
      status: { in: ["WAITING", "IN_HELP"] },
    },
    orderBy: {
      checkedInAt: "asc",
    },
    include: {
      student: {
        select: {
          publicId: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const waitingRows = rows.filter((row) => row.status === "WAITING");
  const helpingRows = rows.filter((row) => row.status === "IN_HELP");

  // Build a display name from first + last name, fall back to publicId
  function resolveName(student: { publicId: string; firstName: string | null; lastName: string | null }): string {
    const name = [student.firstName, student.lastName].filter(Boolean).join(" ");
    return name || student.publicId;
  }

  // Map waiting rows to DTO, rank starts at 1
  const waiting = waitingRows.map((row, index) => ({
    attendancePublicId: row.publicId,
    studentPublicId: row.student.publicId,
    studentName: resolveName(row.student),
    rank: index + 1,
  }));

  // Map helping rows to DTO (no rank)
  const helping = helpingRows.map((row) => ({
    attendancePublicId: row.publicId,
    studentPublicId: row.student.publicId,
    studentName: resolveName(row.student),
  }));

  return {
    sessionStatus,
    endsAt: endsAt.toISOString(),
    waiting,
    helping,
  };
}
