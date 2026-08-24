import { prisma } from "@/lib/prisma";

export async function getUpcomingSessionsForStudent(
  userId: number,
  offeringPublicId: string,
) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 999);

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
