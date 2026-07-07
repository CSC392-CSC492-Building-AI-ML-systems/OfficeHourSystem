import { getRequestSession } from "@/lib/auth/getRequestSession";
import { parseSessionUserId } from "@/lib/auth/getRequestSession";
import { assertSessionOperator } from "@/lib/auth/sessionOperator";
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
      status: true,
      endsAt: true,
      title: true,
      offering: { select: { course: { select: { code: true } } } },
    },
  });

  if (!ohSession) {
    throw new Error("Session not found");
  }

  // Step 3: Only the offering's instructor or a host of this session may view
  await assertSessionOperator(userId, ohSession.id, ohSession.offeringId);

  // Step 4: Return the queue state
  return getActiveQueue(
    ohSession.id,
    ohSession.status,
    ohSession.endsAt,
    ohSession.offering.course.code,
    ohSession.title,
  );
}
