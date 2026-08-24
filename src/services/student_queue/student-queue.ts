import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import {
  getActiveTicketsForStudent,
  getQueuePosition,
} from "@/lib/queries/student_queue/student-queue";
import type { StudentQueueTicketDto } from "@/lib/types/queue";
import { getWaitStatsForCourses } from "@/lib/waitStats";
import { formatCourseLabel } from "@/lib/courseLabel";

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

  // Step 3: Load one set of historical stats per course. This intentionally
  // includes completed visits from archived offerings of the same course.
  const statsByCourseId = await getWaitStatsForCourses(
    tickets.map((ticket) => ticket.session.offering.courseId),
  );

  const now = Date.now();

  // Step 4: Build DTOs — queue position requires one COUNT query per ticket
  return Promise.all(
    tickets.map(async (t) => {
      const isInHelp = t.status === "IN_HELP";
      const stats = statsByCourseId.get(t.session.offering.courseId) ?? null;

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
        courseLabel: formatCourseLabel(
          t.session.offering.course.code,
          t.session.offering.termCode,
        ),
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
        waitEstimateAverageMinutes: stats?.avgMinutes ?? null,
        waitEstimateSampleSize: stats?.sampleSize ?? 0,
      };
    }),
  );
}
