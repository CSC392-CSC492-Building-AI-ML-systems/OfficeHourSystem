import { prisma } from "@/lib/prisma";
import { getActiveTeachingOfferingIds } from "@/lib/queries/offeringMember";

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
  const offeringIds = await getActiveTeachingOfferingIds(userId);

  // If the user is not in any offering, return empty list
  if (offeringIds.length === 0) {
    return [];
  }

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
    },
    orderBy: {
      startsAt: "asc",
    },
  });

  return sessions;
}
