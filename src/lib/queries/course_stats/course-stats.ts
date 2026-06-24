import { prisma } from "@/lib/prisma";
import type { CourseStatsSessionDto } from "@/lib/types/queue";

// Attendance metrics only make sense once a session has started; for SCHEDULED
// or DELAYED (not yet run) sessions we report null so the UI shows "NA".
function hasAttendanceData(status: string): boolean {
  return (
    status === "ACTIVE" || status === "COMPLETED" || status === "CANCELLED"
  );
}

function hostNamesOf(
  hosts: {
    user: {
      firstName: string | null;
      lastName: string | null;
      publicId: string;
    };
  }[],
): string[] {
  return hosts.map(
    (h) =>
      [h.user.firstName, h.user.lastName].filter(Boolean).join(" ") ||
      h.user.publicId,
  );
}

// All DEBUGGING sessions (any status) in ONE offering, each with its four
// aggregate metrics. Powers the session-level stats page for that course.
//
// Fixed 3 queries regardless of session count (sessions + records + interests),
// then aggregates in memory — no per-session N+1.
export async function getSessionStatsForOffering(
  offeringId: number,
): Promise<CourseStatsSessionDto[]> {
  const sessions = await prisma.officeHourSession.findMany({
    where: { offeringId, type: "DEBUGGING" },
    include: {
      offering: { include: { course: true } },
      hosts: {
        include: {
          user: { select: { firstName: true, lastName: true, publicId: true } },
        },
      },
    },
    orderBy: { startsAt: "desc" },
  });
  if (sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);
  const [records, interests] = await Promise.all([
    prisma.officeHourAttendanceRecord.findMany({
      where: { sessionId: { in: sessionIds } },
      select: { sessionId: true, studentId: true, helpStartedAt: true },
    }),
    prisma.officeHourInterest.findMany({
      where: { sessionId: { in: sessionIds } },
      select: { sessionId: true, userId: true },
    }),
  ]);

  // Group by session in memory
  const recordsBySession = new Map<
    number,
    { studentId: number; helpStartedAt: Date | null }[]
  >();
  for (const r of records) {
    const arr = recordsBySession.get(r.sessionId) ?? [];
    arr.push(r);
    recordsBySession.set(r.sessionId, arr);
  }
  const interestsBySession = new Map<number, number[]>();
  for (const i of interests) {
    const arr = interestsBySession.get(i.sessionId) ?? [];
    arr.push(i.userId);
    interestsBySession.set(i.sessionId, arr);
  }

  return sessions.map((s): CourseStatsSessionDto => {
    const interestUserIds = interestsBySession.get(s.id) ?? [];
    const base = {
      sessionPublicId: s.publicId,
      courseCode: s.offering.course.code,
      title: s.title,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      location: s.location ?? "TBD",
      status: s.status,
      hostNames: hostNamesOf(s.hosts),
      interested: interestUserIds.length,
    };

    // Not started yet → attendance metrics are NA
    if (!hasAttendanceData(s.status)) {
      return {
        ...base,
        checkedIn: null,
        gotHelp: null,
        interestedShowed: null,
      };
    }

    const recs = recordsBySession.get(s.id) ?? [];
    const checkedInStudents = new Set(recs.map((r) => r.studentId));
    const helpedStudents = new Set(
      recs.filter((r) => r.helpStartedAt !== null).map((r) => r.studentId),
    );
    // interest rows are unique per (user, session), so no dedupe needed here
    const interestedShowed = interestUserIds.filter((uid) =>
      checkedInStudents.has(uid),
    ).length;

    return {
      ...base,
      checkedIn: checkedInStudents.size,
      gotHelp: helpedStudents.size,
      interestedShowed,
    };
  });
}
