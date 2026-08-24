import type { CourseRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type SessionOperator = {
  role: CourseRole | null; // the user's role in the offering, if any
  isInstructor: boolean;
  hostId: number | null; // existing OfficeHourSessionHost id, if registered
};

/**
 * Authorize a queue operator for ONE office hour session.
 *
 * Passes only if the user is either:
 *   - an INSTRUCTOR of the offering (blanket access, whether or not a host), or
 *   - a registered host of THIS session (the TA on duty).
 *
 * A plain teaching-team TA who is not a host of this session is rejected.
 */
export async function assertSessionOperator(
  userId: number,
  sessionId: number,
  offeringId: number,
): Promise<SessionOperator> {
  const [session, member, host] = await Promise.all([
    prisma.officeHourSession.findUnique({
      where: { id: sessionId },
      select: { offeringId: true, type: true },
    }),
    prisma.offeringMember.findUnique({
      where: { userId_offeringId: { userId, offeringId } },
      select: { role: true },
    }),
    prisma.officeHourSessionHost.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
      select: { id: true },
    }),
  ]);

  if (!session || session.offeringId !== offeringId) {
    throw new Error("Office hour session not found");
  }

  if (session.type !== "DEBUGGING") {
    throw new Error("Queues are only available for Help Centre sessions");
  }

  const isInstructor = member?.role === "INSTRUCTOR";
  if (!isInstructor && host === null) {
    throw new Error(
      "Forbidden: only the course instructor or a host of this session can do this",
    );
  }

  return { role: member?.role ?? null, isInstructor, hostId: host?.id ?? null };
}

/**
 * Ensure the acting user has a host row for this session, then return its id.
 *
 * Used by the help-recording paths so helpedByHostId is never null when a
 * student is actually helped — an instructor who helps but was never scheduled
 * as a host gets a host row created on the spot (needed for academic-offence
 * lookups, "who helped this student").
 */
export async function ensureSessionHost(
  sessionId: number,
  userId: number,
  role: CourseRole,
): Promise<number> {
  const host = await prisma.officeHourSessionHost.upsert({
    where: { sessionId_userId: { sessionId, userId } },
    update: {},
    create: { sessionId, userId, role },
    select: { id: true },
  });
  return host.id;
}
