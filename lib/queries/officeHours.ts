import { prisma } from "@/lib/prisma";

//example of useage
// const sessions = await getUpcomingSessionsByStudentIdentifier("student@mail.utoronto.ca");
// console.log(sessions);
export async function getUpcomingSessionsByStudentIdentifier(
  identifier: string,
) {
  const keyword = identifier.trim();

  // 1. Find user by utorid or email.
  // The input can be either:
  // utorid, e.g. "abcefghi"
  // email, e.g. "student@mail.utoronto.ca"
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        {
          utorid: keyword,
        },
        {
          email: keyword,
        },
      ],
    },
  });

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
  const sessions = await prisma.officeHourSession.findMany({
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
