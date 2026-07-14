import { prisma } from "@/lib/prisma";

export async function getUpcomingSessionsForStudent(userId: number) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 999);

  const memberships = await prisma.offeringMember.findMany({
    where: { userId },
    select: { offeringId: true },
  });

  if (memberships.length === 0) return [];

  const offeringIds = memberships.map((m) => m.offeringId);

  return prisma.officeHourSession.findMany({
    where: {
      offeringId: { in: offeringIds },
      startsAt: { gte: start, lte: end },
      status: { in: ["SCHEDULED", "ACTIVE", "DELAYED"] },
    },
    select: {
      id: true,
      publicId: true,
      title: true,
      type: true,
      location: true,
      startsAt: true,
      endsAt: true,
      status: true,
      offering: { select: { course: { select: { code: true } } } },
      interests: {
        where: { userId },
        select: { id: true },
      },
    },
    orderBy: { startsAt: "asc" },
  });
}
