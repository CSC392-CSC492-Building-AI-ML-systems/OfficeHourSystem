import { prisma } from "@/lib/prisma";
import type {
  SessionStatsStudentDto,
  SessionVisitDto,
} from "@/lib/types/queue";

// Minutes between two timestamps, rounded; null if either is missing → "NA".
function minutesBetween(from: Date | null, to: Date | null): number | null {
  if (!from || !to) return null;
  return Math.round((to.getTime() - from.getTime()) / 60_000);
}

function fullName(user: {
  firstName: string | null;
  lastName: string | null;
  publicId: string;
}): string {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.publicId
  );
}

export type SessionStatsMeta = {
  id: number;
  offeringId: number;
  offeringPublicId: string;
  courseCode: string;
  termCode: string;
  title: string;
  startsAt: string;
  endsAt: string;
  location: string;
  status: "SCHEDULED" | "ACTIVE" | "DELAYED" | "COMPLETED" | "CANCELLED";
  hostNames: string[];
};

// One session lookup: meta + offering ids (used for both auth and display).
export async function getSessionStatsMeta(
  sessionPublicId: string,
): Promise<SessionStatsMeta | null> {
  const s = await prisma.officeHourSession.findUnique({
    where: { publicId: sessionPublicId },
    include: {
      offering: { include: { course: true } },
      hosts: {
        include: {
          user: { select: { firstName: true, lastName: true, publicId: true } },
        },
      },
    },
  });
  if (!s) return null;
  return {
    id: s.id,
    offeringId: s.offeringId,
    offeringPublicId: s.offering.publicId,
    courseCode: s.offering.course.code,
    termCode: s.offering.termCode,
    title: s.title,
    startsAt: s.startsAt.toISOString(),
    endsAt: s.endsAt.toISOString(),
    location: s.location ?? "TBD",
    status: s.status,
    hostNames: s.hosts.map((h) => fullName(h.user)),
  };
}

// Per-student visits for a session, sorted by total help time → visit count →
// total wait time (all descending).
export async function getSessionStatsStudents(
  sessionId: number,
): Promise<SessionStatsStudentDto[]> {
  const records = await prisma.officeHourAttendanceRecord.findMany({
    where: { sessionId },
    include: {
      student: {
        select: {
          firstName: true,
          lastName: true,
          publicId: true,
          studentNumber: true,
        },
      },
      helpedByHost: {
        include: {
          user: { select: { firstName: true, lastName: true, publicId: true } },
        },
      },
    },
    orderBy: { checkedInAt: "asc" },
  });

  const byStudent = new Map<number, SessionStatsStudentDto>();
  for (const r of records) {
    const helpMinutes = minutesBetween(r.helpStartedAt, r.helpEndedAt);
    const waitMinutes = minutesBetween(r.checkedInAt, r.helpStartedAt);
    const visit: SessionVisitDto = {
      helperName: r.helpedByHost ? fullName(r.helpedByHost.user) : null,
      helpMinutes,
      waitMinutes,
      outcome: r.outcome,
    };

    let group = byStudent.get(r.studentId);
    if (!group) {
      group = {
        studentName: fullName(r.student),
        studentNumber: r.student.studentNumber,
        visitCount: 0,
        totalHelpMinutes: 0,
        totalWaitMinutes: 0,
        visits: [],
      };
      byStudent.set(r.studentId, group);
    }
    group.visitCount += 1;
    group.totalHelpMinutes += helpMinutes ?? 0;
    group.totalWaitMinutes += waitMinutes ?? 0;
    group.visits.push(visit);
  }

  return [...byStudent.values()].sort(
    (a, b) =>
      b.totalHelpMinutes - a.totalHelpMinutes ||
      b.visitCount - a.visitCount ||
      b.totalWaitMinutes - a.totalWaitMinutes,
  );
}
