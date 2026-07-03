import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

// Get the start and end of today (midnight to 23:59:59)
function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

// Find office hour sessions happening today that this user may run. The rule is
// the same in both modes — INSTRUCTOR sees every session, a TA sees only the
// sessions they host — but `offeringId` decides the scope:
//   - offeringId given  → one offering (per-offering page): instructor of THAT
//                          offering sees all its sessions; otherwise only hosted.
//   - offeringId omitted → across all the user's offerings (legacy cross-course
//                          view): all sessions in their instructor offerings,
//                          plus any session they host.
export async function getTodaySessionsForTeachingTeam(
  userId: number,
  offeringId?: number,
) {
  const { start, end } = getTodayRange();

  let where: Prisma.OfficeHourSessionWhereInput;

  if (offeringId !== undefined) {
    // Scoped to one offering. Instructor of it → no host filter (see all);
    // otherwise → only sessions this user hosts in it.
    const isInstructor = await prisma.offeringMember.findFirst({
      where: { userId, offeringId, role: "INSTRUCTOR" },
      select: { id: true },
    });
    where = {
      offeringId,
      startsAt: { gte: start, lte: end },
      ...(isInstructor ? {} : { hosts: { some: { userId } } }),
    };
  } else {
    // Cross-offering. ({ in: [] } matches nothing, so a pure TA with no hosted
    // sessions today gets an empty list.)
    const instructorMemberships = await prisma.offeringMember.findMany({
      where: { userId, role: "INSTRUCTOR" },
      select: { offeringId: true },
    });
    const instructorOfferingIds = instructorMemberships.map(
      (m) => m.offeringId,
    );
    where = {
      startsAt: { gte: start, lte: end },
      OR: [
        { offeringId: { in: instructorOfferingIds } },
        { hosts: { some: { userId } } },
      ],
    };
  }

  return prisma.officeHourSession.findMany({
    where,
    include: {
      offering: { include: { course: true } },
      _count: { select: { interests: true } },
    },
    orderBy: { startsAt: "asc" },
  });
}
