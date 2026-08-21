import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { prisma } from "@/lib/prisma";
import { getTodaySessionsForTeachingTeam } from "@/lib/queries/show_upcoming_oh/show-upcoming-oh";
import type { UpcomingSessionDto } from "@/lib/types/queue";
import { formatCourseLabel } from "@/lib/courseLabel";

export async function showUpcomingOhService(
  offeringPublicId?: string,
): Promise<UpcomingSessionDto[]> {
  // Step 1: Read the session cookie
  const session = await getRequestSession();

  // If no session cookie, user is not logged in
  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = parseSessionUserId(session);

  // Step 2 + 3: Authorize, then load today's sessions — scoped to one offering
  // when a publicId is given (per-offering page), otherwise across all the
  // user's offerings (legacy cross-course view).
  let sessions;
  if (offeringPublicId) {
    const offering = await prisma.courseOffering.findUnique({
      where: { publicId: offeringPublicId },
      select: { id: true },
    });
    if (!offering) {
      throw new Error("Offering not found");
    }

    // Must be a TA or INSTRUCTOR of THIS offering
    const membership = await prisma.offeringMember.findUnique({
      where: { userId_offeringId: { userId, offeringId: offering.id } },
      select: { role: true },
    });
    if (!membership || membership.role === "STUDENT") {
      throw new Error("Forbidden: only instructors and TAs can view this page");
    }

    // Pass the already-verified role down — avoids re-querying membership.
    sessions = await getTodaySessionsForTeachingTeam(userId, {
      offeringId: offering.id,
      isInstructor: membership.role === "INSTRUCTOR",
    });
  } else {
    // Must be a TA or INSTRUCTOR in at least one offering
    const membership = await prisma.offeringMember.findFirst({
      where: { userId, role: { in: ["INSTRUCTOR", "TA"] } },
      select: { id: true },
    });
    if (!membership) {
      throw new Error("Forbidden: only instructors and TAs can view this page");
    }

    sessions = await getTodaySessionsForTeachingTeam(userId);
  }

  // Step 4: Map DB rows to DTO
  return sessions.map((session) => ({
    sessionPublicId: session.publicId,
    courseLabel: formatCourseLabel(
      session.offering.course.code,
      session.offering.termCode,
    ),
    title: session.title,
    startsAt: session.startsAt.toISOString(),
    endsAt: session.endsAt.toISOString(),
    location: session.location ?? "TBD",
    status: session.status,
    interestedCount: session._count.interests,
  }));
}
