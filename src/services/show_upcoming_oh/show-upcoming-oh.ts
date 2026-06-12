import { getRequestSession } from "@/lib/auth/getRequestSession";
import { parseSessionUserId } from "@/lib/auth/getRequestSession";
import { getTodaySessionsForTeachingTeam } from "@/lib/queries/show_upcoming_oh/show-upcoming-oh";
import type { UpcomingSessionDto } from "@/lib/types/queue";

// Only INSTRUCTOR and TA are allowed to view upcoming sessions
const ALLOWED_ROLES = ["INSTRUCTOR", "TA"];

export async function showUpcomingOhService(): Promise<UpcomingSessionDto[]> {
  // Step 1: Read the session cookie
  const session = await getRequestSession();

  // If no session cookie, user is not logged in
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Step 2: Check the user's role is INSTRUCTOR or TA
  if (!ALLOWED_ROLES.includes(session.role)) {
    throw new Error("Forbidden: only instructors and TAs can view this page");
  }

  // Step 3: Get the user's numeric ID from the session
  const userId = parseSessionUserId(session);

  // Step 4: Query today's sessions for this user's offerings
  const sessions = await getTodaySessionsForTeachingTeam(userId);

  // Step 5: Map DB rows to DTO
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
