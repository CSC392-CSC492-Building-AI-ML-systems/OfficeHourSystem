import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import {
  getActiveTicketsForStudent,
  getQueuePosition,
} from "@/lib/queries/student_queue/student-queue";
import type { StudentQueueTicketDto } from "@/lib/types/queue";
import { getWaitStats } from "@/lib/waitStats";

export async function getStudentQueueService(): Promise<
  StudentQueueTicketDto[]
> {
  // Step 1: Verify session cookie — just check it exists, no role query needed
  const session = await getRequestSession();
  if (!session) throw new Error("Unauthorized");
  const userId = parseSessionUserId(session);

  // Step 2: Fetch all active tickets for this student
  const tickets = await getActiveTicketsForStudent(userId);
  if (tickets.length === 0) return [];

  // Step 3: Load pre-computed wait stats (from JSON file, no DB query)
  const stats = getWaitStats();

  const now = Date.now();

  // Step 4: Build DTOs — queue position requires one COUNT query per ticket
  return Promise.all(
    tickets.map(async (t) => {
      const isInHelp = t.status === "IN_HELP";

      const position = isInHelp
        ? 0
        : await getQueuePosition(t.session.publicId, t.checkedInAt);

      const waitedMinutes = Math.floor(
        (now - t.checkedInAt.getTime()) / 60_000,
      );

      const peopleAhead = Math.max(0, position - 1);
      const estimatedWaitMinutes =
        !isInHelp && stats
          ? Math.round(peopleAhead * stats.avgMinutes * 10) / 10
          : null;

      const estimatedWaitMargin = !isInHelp && stats ? stats.margin85 : null;

      return {
        attendancePublicId: t.publicId,
        sessionPublicId: t.session.publicId,
        courseCode: t.session.offering.course.code,
        sessionTitle: t.session.title,
        location: t.session.location ?? "TBD",
        startsAt: t.session.startsAt.toISOString(),
        endsAt: t.session.endsAt.toISOString(),
        status: t.status as "WAITING" | "IN_HELP",
        position,
        checkedInAt: t.checkedInAt.toISOString(),
        waitedMinutes,
        estimatedWaitMinutes,
        estimatedWaitMargin,
      };
    }),
  );
}
