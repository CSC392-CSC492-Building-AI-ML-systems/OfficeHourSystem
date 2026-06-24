import { prisma } from "@/lib/prisma";

// Get the start and end of today (midnight to 23:59:59)
function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

// Find all office hour sessions happening today
// for offerings where the user is an INSTRUCTOR or TA
export async function getTodaySessionsForTeachingTeam(userId: number) {
  // Step 1: Find all offerings this user belongs to as INSTRUCTOR or TA
  const memberships = await prisma.offeringMember.findMany({
    where: {
      userId: userId,
      role: { in: ["INSTRUCTOR", "TA"] },
    },
    select: {
      offeringId: true,
    },
  });

  // If the user is not in any offering, return empty list
  if (memberships.length === 0) {
    return [];
  }

  const offeringIds = memberships.map((m) => m.offeringId);

  // Step 2: Find all sessions today in those offerings
  const { start, end } = getTodayRange();

  const sessions = await prisma.officeHourSession.findMany({
    where: {
      offeringId: { in: offeringIds },
      startsAt: { gte: start, lte: end },
    },
    include: {
      offering: {
        include: {
          course: true,
        },
      },
      _count: {
        select: { interests: true },
      },
    },
    orderBy: {
      startsAt: "asc",
    },
  });

  return sessions;
}
