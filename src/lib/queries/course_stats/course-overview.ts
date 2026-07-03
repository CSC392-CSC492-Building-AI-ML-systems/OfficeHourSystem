import { prisma } from "@/lib/prisma";
import type {
  CourseOverviewDto,
  CourseStudentDetailDto,
  CourseVisitDto,
  InstructorOfferingDto,
} from "@/lib/types/queue";

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

// Offerings where the user is an INSTRUCTOR (for the course picker).
export async function getInstructorOfferings(
  userId: number,
): Promise<InstructorOfferingDto[]> {
  const members = await prisma.offeringMember.findMany({
    where: { userId, role: "INSTRUCTOR" },
    include: { offering: { include: { course: true } } },
    orderBy: { offering: { termCode: "desc" } },
  });
  return members.map((m) => ({
    offeringPublicId: m.offering.publicId,
    courseCode: m.offering.course.code,
    termCode: m.offering.termCode,
  }));
}

// Resolve an offering by its public id (used for the per-offering auth check).
export async function getOfferingByPublicId(offeringPublicId: string) {
  return prisma.courseOffering.findUnique({
    where: { publicId: offeringPublicId },
    select: {
      id: true,
      publicId: true,
      termCode: true,
      course: { select: { code: true } },
    },
  });
}

// Aggregate stats for one offering. Caller supplies resolved offering meta.
//
// Scope rules (per the spec):
//  - "helped", "checked in", "avg help time", "interested → came" and ALL
//    per-session averages count only ENDED (COMPLETED) sessions.
//  - "interested" (record count + distinct people) spans the whole offering.
//  - Ratios are over the offering's enrolled student count.
export async function getCourseOverview(offering: {
  id: number;
  publicId: string;
  termCode: string;
  courseCode: string;
}): Promise<CourseOverviewDto> {
  const sessions = await prisma.officeHourSession.findMany({
    where: { offeringId: offering.id },
    select: { id: true, status: true },
  });
  const allSessionIds = sessions.map((s) => s.id);
  const endedSessionIds = sessions
    .filter((s) => s.status === "COMPLETED")
    .map((s) => s.id);
  const endedIdSet = new Set(endedSessionIds);

  const [totalStudents, endedRecords, allInterests] = await Promise.all([
    prisma.offeringMember.count({
      where: { offeringId: offering.id, role: "STUDENT" },
    }),
    // Only ENDED sessions' records feed helped / checked-in / avg-help metrics
    prisma.officeHourAttendanceRecord.findMany({
      where: { sessionId: { in: endedSessionIds } },
      select: {
        sessionId: true,
        studentId: true,
        helpStartedAt: true,
        helpEndedAt: true,
      },
    }),
    // Interest spans the whole offering
    prisma.officeHourInterest.findMany({
      where: { sessionId: { in: allSessionIds } },
      select: { sessionId: true, userId: true },
    }),
  ]);

  // ── Course totals (ENDED sessions for attendance-based metrics) ──────────
  const helpedStudents = new Set<number>();
  const checkedInStudents = new Set<number>();
  let helpDurSum = 0;
  let helpDurCount = 0;
  for (const r of endedRecords) {
    checkedInStudents.add(r.studentId); // any outcome — a check-in is a swipe
    if (r.helpStartedAt) helpedStudents.add(r.studentId);
    const dur = minutesBetween(r.helpStartedAt, r.helpEndedAt);
    if (dur !== null) {
      helpDurSum += dur;
      helpDurCount += 1;
    }
  }

  // Interest (whole offering) + interested→came (ENDED only)
  const interestedUsers = new Set(allInterests.map((i) => i.userId));
  const endedInterestedUsers = new Set(
    allInterests
      .filter((i) => endedIdSet.has(i.sessionId))
      .map((i) => i.userId),
  );
  let showed = 0;
  for (const uid of endedInterestedUsers)
    if (checkedInStudents.has(uid)) showed += 1;

  // ── Per-ENDED-session averages (distinct people per session) ─────────────
  const helpedPerSession = new Map<number, Set<number>>();
  const checkedInPerSession = new Map<number, Set<number>>();
  for (const r of endedRecords) {
    const inSet = checkedInPerSession.get(r.sessionId) ?? new Set();
    inSet.add(r.studentId);
    checkedInPerSession.set(r.sessionId, inSet);
    if (r.helpStartedAt) {
      const hSet = helpedPerSession.get(r.sessionId) ?? new Set();
      hSet.add(r.studentId);
      helpedPerSession.set(r.sessionId, hSet);
    }
  }
  const interestedPerSession = new Map<number, Set<number>>();
  for (const i of allInterests) {
    if (!endedIdSet.has(i.sessionId)) continue;
    const set = interestedPerSession.get(i.sessionId) ?? new Set();
    set.add(i.userId);
    interestedPerSession.set(i.sessionId, set);
  }

  const numEnded = endedSessionIds.length;
  let sumHelped = 0;
  let sumInterested = 0;
  let sumCheckIns = 0;
  for (const sid of endedSessionIds) {
    sumHelped += helpedPerSession.get(sid)?.size ?? 0;
    sumInterested += interestedPerSession.get(sid)?.size ?? 0;
    sumCheckIns += checkedInPerSession.get(sid)?.size ?? 0;
  }

  return {
    offeringPublicId: offering.publicId,
    courseCode: offering.courseCode,
    termCode: offering.termCode,
    totalStudents,
    endedSessionCount: numEnded,
    // Course totals
    studentsHelped: helpedStudents.size,
    helpedRatio: totalStudents ? helpedStudents.size / totalStudents : null,
    interestRecords: allInterests.length,
    studentsInterested: interestedUsers.size,
    interestedRatio: totalStudents
      ? interestedUsers.size / totalStudents
      : null,
    studentsCheckedIn: checkedInStudents.size,
    interestedShowedRatio: endedInterestedUsers.size
      ? showed / endedInterestedUsers.size
      : null,
    avgHelpMinutes: helpDurCount ? helpDurSum / helpDurCount : null,
    // Per-ENDED-session averages
    avgHelpedPerSession: numEnded ? sumHelped / numEnded : null,
    avgInterestedPerSession: numEnded ? sumInterested / numEnded : null,
    avgCheckInsPerSession: numEnded ? sumCheckIns / numEnded : null,
  };
}

// Per-student detail across the whole offering, grouped and sorted by
// visit count → helped count → total help minutes (all descending).
export async function getCourseStudentDetails(
  offeringId: number,
): Promise<CourseStudentDetailDto[]> {
  const sessions = await prisma.officeHourSession.findMany({
    where: { offeringId },
    select: { id: true },
  });
  const sessionIds = sessions.map((s) => s.id);

  const records = await prisma.officeHourAttendanceRecord.findMany({
    where: { sessionId: { in: sessionIds } },
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
      session: { select: { title: true } },
    },
    orderBy: { checkedInAt: "asc" },
  });

  const byStudent = new Map<number, CourseStudentDetailDto>();
  for (const r of records) {
    const helpMinutes = minutesBetween(r.helpStartedAt, r.helpEndedAt);
    const waitMinutes = minutesBetween(r.checkedInAt, r.helpStartedAt);
    const visit: CourseVisitDto = {
      sessionTitle: r.session.title,
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
        helpedCount: 0,
        totalHelpMinutes: 0,
        totalWaitMinutes: 0,
        visits: [],
      };
      byStudent.set(r.studentId, group);
    }
    group.visitCount += 1;
    if (r.helpStartedAt) group.helpedCount += 1;
    group.totalHelpMinutes += helpMinutes ?? 0;
    group.totalWaitMinutes += waitMinutes ?? 0;
    group.visits.push(visit);
  }

  return [...byStudent.values()].sort(
    (a, b) =>
      b.visitCount - a.visitCount ||
      b.helpedCount - a.helpedCount ||
      b.totalHelpMinutes - a.totalHelpMinutes,
  );
}
