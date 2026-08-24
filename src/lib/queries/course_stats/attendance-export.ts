import { prisma } from "@/lib/prisma";

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

export type AttendanceExportRow = {
  courseCode: string;
  termCode: string;
  sessionTitle: string;
  sessionStartsAt: string;
  sessionEndsAt: string;
  sessionLocation: string;
  sessionHosts: string;
  sessionStatus: string;
  studentName: string;
  studentNumber: string;
  studentUtorid: string;
  checkedInAt: string;
  helpStartedAt: string;
  helpEndedAt: string;
  helperName: string;
  outcome: string;
  waitMinutes: string;
  helpMinutes: string;
};

/** One row per attendance record, sorted by session start then check-in time. */
export async function getOfferingAttendanceExportRows(
  offeringId: number,
): Promise<AttendanceExportRow[]> {
  const records = await prisma.officeHourAttendanceRecord.findMany({
    where: { session: { offeringId } },
    include: {
      student: {
        select: {
          firstName: true,
          lastName: true,
          publicId: true,
          studentNumber: true,
          utorid: true,
        },
      },
      helpedByHost: {
        include: {
          user: { select: { firstName: true, lastName: true, publicId: true } },
        },
      },
      session: {
        include: {
          hosts: {
            include: {
              user: {
                select: { firstName: true, lastName: true, publicId: true },
              },
            },
          },
          offering: { include: { course: true } },
        },
      },
    },
    orderBy: [{ session: { startsAt: "asc" } }, { checkedInAt: "asc" }],
  });

  return records.map((r) => {
    const waitMinutes = minutesBetween(r.checkedInAt, r.helpStartedAt);
    const helpMinutes = minutesBetween(r.helpStartedAt, r.helpEndedAt);
    return {
      courseCode: r.session.offering.course.code,
      termCode: r.session.offering.termCode,
      sessionTitle: r.session.title,
      sessionStartsAt: r.session.startsAt.toISOString(),
      sessionEndsAt: r.session.endsAt.toISOString(),
      sessionLocation: r.session.location ?? "TBD",
      sessionHosts: r.session.hosts.map((h) => fullName(h.user)).join("; "),
      sessionStatus: r.session.status,
      studentName: fullName(r.student),
      studentNumber: r.student.studentNumber ?? "",
      studentUtorid: r.student.utorid,
      checkedInAt: r.checkedInAt.toISOString(),
      helpStartedAt: r.helpStartedAt?.toISOString() ?? "",
      helpEndedAt: r.helpEndedAt?.toISOString() ?? "",
      helperName: r.helpedByHost ? fullName(r.helpedByHost.user) : "",
      outcome: r.outcome,
      waitMinutes: waitMinutes === null ? "" : String(waitMinutes),
      helpMinutes: helpMinutes === null ? "" : String(helpMinutes),
    };
  });
}
