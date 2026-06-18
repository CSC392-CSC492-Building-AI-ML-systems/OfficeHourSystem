import { getRequestSession, parseSessionUserId } from "@/lib/auth/getRequestSession";
import { prisma } from "@/lib/prisma";
import { getTodaySessionsForTeachingTeam } from "@/lib/queries/show_upcoming_oh/show-upcoming-oh";
import type { UpcomingSessionDto } from "@/lib/types/queue";

export async function showUpcomingOhService(): Promise<UpcomingSessionDto[]> {
  // Step 1: Read the session cookie
  const session = await getRequestSession();

  // If no session cookie, user is not logged in
  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = parseSessionUserId(session);

  // Step 2: Check the user is a TA or INSTRUCTOR in at least one offering
  const membership = await prisma.offeringMember.findFirst({
    where: {
      userId,
      role: { in: ["INSTRUCTOR", "TA"] },
    },
    select: { id: true },
  });

  if (!membership) {
    throw new Error("Forbidden: only instructors and TAs can view this page");
  }

  // Step 3: Query today's sessions for this user's offerings
  const sessions = await getTodaySessionsForTeachingTeam(userId);

  // Step 4: Map DB rows to DTO
  return sessions.map((session) => ({
    sessionPublicId: session.publicId,
    courseCode: session.offering.course.code,
    title: session.title,
    startsAt: session.startsAt.toISOString(),
    endsAt: session.endsAt.toISOString(),
    location: session.location ?? "TBD",
    status: session.status,
  }));
}
