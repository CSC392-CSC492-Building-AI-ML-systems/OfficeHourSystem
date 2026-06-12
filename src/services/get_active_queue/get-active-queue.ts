import { getRequestSession } from "@/lib/auth/getRequestSession";
import { parseSessionUserId } from "@/lib/auth/getRequestSession";
import { prisma } from "@/lib/prisma";
import { getActiveQueue } from "@/lib/queries/get_active_queue/get-active-queue";
import type { ActiveQueueDto } from "@/lib/types/queue";

export async function getActiveQueueService(
  sessionPublicId: string,
): Promise<ActiveQueueDto> {
  // Step 1: Read and validate the session cookie
  const session = await getRequestSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = parseSessionUserId(session);

  // Step 2: Find the office hour session by its public ID
  const ohSession = await prisma.officeHourSession.findUnique({
    where: { publicId: sessionPublicId },
    select: {
      id: true,
      offeringId: true,
    },
  });

  if (!ohSession) {
    throw new Error("Session not found");
  }

  // Step 3: Verify the user is an INSTRUCTOR or TA in this offering
  const membership = await prisma.offeringMember.findUnique({
    where: {
      userId_offeringId: {
        userId: userId,
        offeringId: ohSession.offeringId,
      },
    },
    select: { role: true },
  });

  if (!membership || membership.role === "STUDENT") {
    throw new Error("Forbidden: only instructors and TAs can view the queue");
  }

  // Step 4: Return the queue state
  return getActiveQueue(ohSession.id);
}
