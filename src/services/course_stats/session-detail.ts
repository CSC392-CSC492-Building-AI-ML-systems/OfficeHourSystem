import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { prisma } from "@/lib/prisma";
import {
  getSessionStatsMeta,
  getSessionStatsStudents,
} from "@/lib/queries/course_stats/session-detail";
import type { SessionStatsDetailDto } from "@/lib/types/queue";

// Drill-down detail for one session. Cookie must be valid AND the user must be
// INSTRUCTOR in THIS session's offering. One session query (meta, also used for
// the auth check) + one records query — no duplicate lookups.
export async function getSessionStatsDetailService(
  sessionPublicId: string,
): Promise<SessionStatsDetailDto> {
  const session = await getRequestSession();
  if (!session) throw new Error("Unauthorized");
  const userId = parseSessionUserId(session);

  const meta = await getSessionStatsMeta(sessionPublicId);
  if (!meta) throw new Error("Session not found");

  const membership = await prisma.offeringMember.findUnique({
    where: { userId_offeringId: { userId, offeringId: meta.offeringId } },
    select: { role: true },
  });
  if (!membership || membership.role !== "INSTRUCTOR") {
    throw new Error(
      "Forbidden: only the course instructor can view this session's stats",
    );
  }

  const students = await getSessionStatsStudents(meta.id);

  return {
    sessionPublicId,
    offeringPublicId: meta.offeringPublicId,
    courseCode: meta.courseCode,
    title: meta.title,
    startsAt: meta.startsAt,
    endsAt: meta.endsAt,
    location: meta.location,
    status: meta.status,
    hostNames: meta.hostNames,
    students,
  };
}
