import { prisma } from "@/lib/prisma";

export type HomeHeroStats =
  | { kind: "anonymous" }
  | { kind: "unavailable" }
  | {
      kind: "student";
      upcomingSessions: number;
      interestedSessions: number;
      waitingQueues: number;
    }
  | {
      kind: "staff";
      upcomingHostedSessions: number;
      interestPresses: number;
      studentsWaiting: number;
    };

type StaffRole = "TA" | "INSTRUCTOR";

type HomeStatsUser = {
  isInstructor: boolean;
  memberships: { role: StaffRole }[];
};

export type HomeStatsClient = {
  user: {
    findUnique(args: unknown): Promise<HomeStatsUser | null>;
  };
  officeHourSession: {
    count(args: unknown): Promise<number>;
  };
  officeHourInterest: {
    count(args: unknown): Promise<number>;
  };
  officeHourAttendance: {
    count(args: unknown): Promise<number>;
  };
};

export function getHomeStatsWindow(now: Date) {
  const end = new Date(now);
  end.setDate(end.getDate() + 14);
  return { start: now, end };
}

export function buildStudentHomeStatsFilters(userId: number, now: Date) {
  const { end } = getHomeStatsWindow(now);
  const studentOffering = {
    archivedAt: null,
    members: { some: { userId, role: "STUDENT" as const } },
  };

  return {
    upcoming: {
      offering: studentOffering,
      startsAt: { gt: now, lte: end },
      status: { in: ["SCHEDULED", "DELAYED"] as const },
    },
    interested: {
      userId,
      session: {
        offering: studentOffering,
        endsAt: { gt: now },
        status: { in: ["SCHEDULED", "DELAYED"] as const },
      },
    },
    waiting: { studentId: userId, status: "WAITING" as const },
  };
}

export function buildStaffHomeStatsFilters(userId: number, now: Date) {
  const { end } = getHomeStatsWindow(now);
  const upcomingHostedSession = {
    startsAt: { gt: now, lte: end },
    status: { in: ["SCHEDULED", "DELAYED"] as const },
    hosts: { some: { userId } },
  };

  return {
    upcoming: upcomingHostedSession,
    interested: { session: upcomingHostedSession },
    waiting: {
      status: "WAITING" as const,
      session: {
        status: { in: ["ACTIVE", "DELAYED"] as const },
        hosts: { some: { userId } },
      },
    },
  };
}

export async function getHomeHeroStatsForUser(
  userId: number,
  isAdminUser: boolean,
  client?: HomeStatsClient,
  now = new Date(),
): Promise<Exclude<
  HomeHeroStats,
  { kind: "anonymous" | "unavailable" }
> | null> {
  const db = client ?? (prisma as unknown as HomeStatsClient);
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      isInstructor: true,
      memberships: {
        where: { role: { in: ["TA", "INSTRUCTOR"] } },
        select: { role: true },
        take: 1,
      },
    },
  });

  if (!user) return null;

  const isStaff =
    isAdminUser || user.isInstructor || user.memberships.length > 0;

  if (isStaff) {
    const filters = buildStaffHomeStatsFilters(userId, now);
    const [upcomingHostedSessions, interestPresses, studentsWaiting] =
      await Promise.all([
        db.officeHourSession.count({ where: filters.upcoming }),
        db.officeHourInterest.count({ where: filters.interested }),
        db.officeHourAttendance.count({ where: filters.waiting }),
      ]);

    return {
      kind: "staff",
      upcomingHostedSessions,
      interestPresses,
      studentsWaiting,
    };
  }

  const filters = buildStudentHomeStatsFilters(userId, now);
  const [upcomingSessions, interestedSessions, waitingQueues] =
    await Promise.all([
      db.officeHourSession.count({ where: filters.upcoming }),
      db.officeHourInterest.count({ where: filters.interested }),
      db.officeHourAttendance.count({ where: filters.waiting }),
    ]);

  return {
    kind: "student",
    upcomingSessions,
    interestedSessions,
    waitingQueues,
  };
}
