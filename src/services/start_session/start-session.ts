import { getRequestSession, parseSessionUserId } from "@/lib/auth/getRequestSession";
import { prisma } from "@/lib/prisma";
import { startSession } from "@/lib/queries/start_session/start-session";

type StartSessionResult =
  | { outcome: "started" }
  | { outcome: "already_active" }
  | { outcome: "invalid_state" };

export async function startSessionService(
  sessionPublicId: string,
): Promise<StartSessionResult> {
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
  const member = await prisma.offeringMember.findUnique({
    where: {
      userId_offeringId: {
        userId,
        offeringId: ohSession.offeringId,
      },
    },
    select: { role: true },
  });
  if (!member || member.role === "STUDENT") {
    throw new Error("Forbidden: only TAs and instructors can start a session");
  }

  // Step 4: Transition the session status
  const result = await startSession(ohSession.id);
  return { outcome: result };
}
