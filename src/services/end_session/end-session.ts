import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { prisma } from "@/lib/prisma";
import { getActiveOfferingMembership } from "@/lib/queries/offeringMember";
import { endSession } from "@/lib/queries/end_session/end-session";

type EndSessionResult =
  | { outcome: "ended" }
  | { outcome: "already_ended" }
  | { outcome: "not_found" };

export async function endSessionService(
  sessionPublicId: string,
): Promise<EndSessionResult> {
  // Step 1: Validate cookie, get current user
  const session = await getRequestSession();
  if (!session) throw new Error("Unauthorized");
  const userId = parseSessionUserId(session);

  // Step 2: Find the office hour session
  const ohSession = await prisma.officeHourSession.findUnique({
    where: { publicId: sessionPublicId },
    select: { id: true, offeringId: true },
  });
  if (!ohSession) throw new Error("Session not found");

  // Step 3: Check the user is a TA or INSTRUCTOR in this offering
  const member = await getActiveOfferingMembership(
    userId,
    ohSession.offeringId,
  );
  if (!member || member.role === "STUDENT") {
    throw new Error("Forbidden: only TAs and instructors can end a session");
  }

  // Step 4: End the session and bulk-resolve all remaining attendances
  const result = await endSession(ohSession.id);
  return { outcome: result };
}
