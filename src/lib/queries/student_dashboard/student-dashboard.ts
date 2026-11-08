import { prisma } from "@/lib/prisma";
import { addDays, endOfLocalDay } from "@/lib/scheduling/time";
import { getTorontoTodayRange } from "@/lib/time/toronto";

export async function getUpcomingSessionsForStudent(
  userId: number,
  offeringPublicId: string,
) {
  const { start } = getTorontoTodayRange();
  const end = endOfLocalDay(addDays(start, 14));

  const membership = await prisma.offeringMember.findFirst({
    where: { userId, offering: { publicId: offeringPublicId } },
    select: { offeringId: true },
  });

  if (!membership) return [];

  return prisma.officeHourSession.findMany({
    where: {
      offeringId: membership.offeringId,
      startsAt: { gte: start, lte: end },
      status: { in: ["SCHEDULED", "ACTIVE", "DELAYED"] },
    },
    select: {
      id: true,
      publicId: true,
      title: true,
      description: true,
      type: true,
      location: true,
      startsAt: true,
      endsAt: true,
      status: true,
      offering: {
        select: {
          termCode: true,
          course: { select: { code: true } },
        },
      },
      interests: {
        where: { userId },
        select: { id: true },
      },
    },
    orderBy: { startsAt: "asc" },
  });
}
