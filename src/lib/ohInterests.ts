import { prisma } from "@/lib/prisma";

export type RecordInterestResult = {
  interestId: number;
  userId: number;
  sessionId: number;
};

export type RemoveInterestResult = {
  removed: boolean;
  userId: number;
  sessionId: number;
};

type InterestClient = {
  officeHourSession: {
    findUnique(
      args: unknown,
    ): Promise<{ id: number; offeringId: number } | null>;
  };
  offeringMember: {
    findUnique(args: unknown): Promise<{ id: number; role: string } | null>;
  };
  officeHourInterest: {
    upsert(args: unknown): Promise<{ id: number }>;
    deleteMany(args: unknown): Promise<{ count: number }>;
  };
};

/**
 * Record that a user is interested in an office hour session.
 *
 * The user must be a member of the session's course offering.
 * If an interest row already exists, this is a no-op and returns the existing record.
 */
export async function recordSessionInterest(
  userId: number,
  sessionId: number,
  client?: InterestClient,
): Promise<RecordInterestResult> {
  const db = client ?? (prisma as unknown as InterestClient);
  const session = await db.officeHourSession.findUnique({
    where: { id: sessionId },
    select: { id: true, offeringId: true },
  });

  if (!session) {
    throw new Error("Office hour session not found");
  }

  const membership = await db.offeringMember.findUnique({
    where: {
      userId_offeringId: {
        userId,
        offeringId: session.offeringId,
      },
    },
    select: { id: true, role: true },
  });

  if (!membership || membership.role !== "STUDENT") {
    throw new Error("Only enrolled students can mark interest");
  }

  const interest = await db.officeHourInterest.upsert({
    where: {
      userId_sessionId: {
        userId,
        sessionId: session.id,
      },
    },
    update: {},
    create: {
      userId,
      sessionId: session.id,
    },
    select: { id: true },
  });

  return {
    interestId: interest.id,
    userId,
    sessionId: session.id,
  };
}

/** Remove only the current student's interest row. Repeating is a no-op. */
export async function removeSessionInterest(
  userId: number,
  sessionId: number,
  client?: InterestClient,
): Promise<RemoveInterestResult> {
  const db = client ?? (prisma as unknown as InterestClient);
  const result = await db.officeHourInterest.deleteMany({
    where: { userId, sessionId },
  });

  return { removed: result.count > 0, userId, sessionId };
}
