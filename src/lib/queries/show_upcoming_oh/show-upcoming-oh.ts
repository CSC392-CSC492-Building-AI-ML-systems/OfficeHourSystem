import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getTorontoTodayRange } from "@/lib/time/toronto";

// Find office hour sessions happening today that this user may run. The rule is
// the same in both modes — INSTRUCTOR sees every session, a TA sees only the
// sessions they host — but `scope` decides the range:
//   - scope given  → one offering (per-offering page). The caller has already
//                    checked membership, so isInstructor is passed in rather
//                    than re-queried here (no duplicate DB lookups).
//   - scope omitted → across all the user's offerings (legacy cross-course
//                     view): all sessions in their instructor offerings, plus
//                     any session they host.
export async function getTodaySessionsForTeachingTeam(
  userId: number,
  scope?: { offeringId: number; isInstructor: boolean },
) {
  const { start, end } = getTorontoTodayRange();

  let where: Prisma.OfficeHourSessionWhereInput;

  if (scope) {
    // Scoped to one offering. Instructor of it → no host filter (see all);
    // otherwise → only sessions this user hosts in it.
    where = {
      offeringId: scope.offeringId,
      startsAt: { gte: start, lte: end },
      ...(scope.isInstructor ? {} : { hosts: { some: { userId } } }),
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
