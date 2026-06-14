import { prisma } from "@/lib/prisma";

type StartSessionResult = "started" | "already_active" | "invalid_state";

/**
 * Transition a session from SCHEDULED or DELAYED → ACTIVE.
 * Uses updateMany so the check and update are one atomic DB round-trip.
 */
export async function startSession(sessionId: number): Promise<StartSessionResult> {
  const result = await prisma.officeHourSession.updateMany({
    where: {
      id: sessionId,
      status: { in: ["SCHEDULED", "DELAYED"] },
    },
    data: { status: "ACTIVE" },
  });

  if (result.count > 0) {
    return "started";
  }

  // Update didn't match — check why
  const session = await prisma.officeHourSession.findUnique({
    where: { id: sessionId },
    select: { status: true },
  });

  if (session?.status === "ACTIVE") return "already_active";
  return "invalid_state"; // COMPLETED or CANCELLED
}
