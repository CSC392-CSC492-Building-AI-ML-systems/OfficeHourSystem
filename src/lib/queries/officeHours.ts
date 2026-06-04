import { find_user, type UserLookupClient } from "./users";

type UpcomingSession = {
  id: number;
  startsAt: Date;
  [key: string]: unknown;
};

type UpcomingSessionsClient = UserLookupClient & {
  officeHourSession: {
    findMany(args: unknown): Promise<UpcomingSession[]>;
  };
};

//example of useage
// const sessions = await getUpcomingSessionsByStudentIdentifier("student@mail.utoronto.ca");
// console.log(sessions);
export async function getUpcomingSessionsByStudentIdentifier(
  identifier: string,
  client?: UpcomingSessionsClient,
) {
  const db = (client ??
    (await import("../prisma")).prisma) as UpcomingSessionsClient;

  // 1. Find user by utorid, email, or student number.
  // The input can be either:
  // utorid, e.g. "abcefghi"
  // email, e.g. "student@mail.utoronto.ca"
  // student number, e.g. "1011662167"
  const user = await find_user(identifier, db);

  // 2. If user does not exist, return empty list.
  // This means this student is not imported yet.
  if (!user) {
    return [];
  }

  const now = new Date();

  // 3. Future one week means from now to 7 days later.
  const oneWeekLater = new Date(now);
  oneWeekLater.setDate(now.getDate() + 7);

  // 4. Find sessions this student can see.
  // A student can see a session if:
  // - this session belongs to an offering
  // - this user is a STUDENT member of that offering
  // - the session starts in the next 7 days
  // - the session is not cancelled
  const sessions = await db.officeHourSession.findMany({
    where: {
      startsAt: {
        gte: now,
        lte: oneWeekLater,
      },
      status: {
        not: "CANCELLED",
      },
      offering: {
        members: {
          some: {
            userId: user.id,
            role: "STUDENT",
          },
        },
      },
    },
    include: {
      offering: {
        include: {
          course: true,
        },
      },
      hosts: {
        include: {
          user: true,
        },
      },
      interests: {
        where: {
          userId: user.id,
        },
      },
    },
    orderBy: {
      startsAt: "asc",
    },
  });

  return sessions;
}
