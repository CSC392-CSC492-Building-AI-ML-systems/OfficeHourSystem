import { prisma } from "@/lib/prisma";
import type { ActiveQueueDto } from "@/lib/types/queue";

// Get the full queue state for a session:
// - all WAITING students ordered by check-in time (earliest = rank 1)
// - all IN_HELP students (no rank)
export async function getActiveQueue(sessionId: number): Promise<ActiveQueueDto> {
  // Fetch session metadata for status and auto-end timer
  const session = await prisma.officeHourSession.findUnique({
    where: { id: sessionId },
    select: { status: true, endsAt: true },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  // Fetch all WAITING attendances, sorted by who checked in first
  const waitingRows = await prisma.officeHourAttendance.findMany({
    where: {
      sessionId: sessionId,
      status: "WAITING",
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

  // Fetch all IN_HELP attendances
  const helpingRows = await prisma.officeHourAttendance.findMany({
    where: {
      sessionId: sessionId,
      status: "IN_HELP",
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
    sessionStatus: session.status,
    endsAt: session.endsAt.toISOString(),
    waiting,
    helping,
  };
}
