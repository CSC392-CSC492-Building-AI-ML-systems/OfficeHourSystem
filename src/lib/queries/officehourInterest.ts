import { find_user, type UserLookupClient } from "./users";
import { getActiveOfferingMembership } from "./offeringMember";

type MarkInterestClient = UserLookupClient & {
  officeHourSession: {
    findUnique(
      args: unknown,
    ): Promise<{ id: number; offeringId: number } | null>;
  };
  offeringMember: {
    findFirst(args: unknown): Promise<unknown>;
  };
  officeHourInterest: {
    upsert(args: unknown): Promise<{ id: number }>;
  };
};

// example useage
// const result = await markInterestedInSession(
//   "student@mail.utoronto.ca",
//   3,
// );
// console.log(result);

export async function markInterestedInSession(
  identifier: string,
  sessionId: number,
  client?: MarkInterestClient,
) {
  const db = (client ??
    (await import("../prisma")).prisma) as MarkInterestClient;

  // input can be utorid, email, or student number
  const user = await find_user(identifier, db);

  // if user does not exist, stop here
  if (!user) {
    throw new Error("User not found");
  }

  // 2. find the office hour session
  const session = await db.officeHourSession.findUnique({
    where: {
      id: sessionId,
    },
  });

  // if session does not exist, stop here
  if (!session) {
    throw new Error("Office hour session not found");
  }

  // 3. check whether this student belongs to this session's offering
  if (client) {
    const membership = await db.offeringMember.findFirst({
      where: {
        userId: user.id,
        offeringId: session.offeringId,
        role: "STUDENT",
        status: "ACTIVE",
      },
    });

    if (!membership) {
      throw new Error("Student is not enrolled in this offering");
    }
  } else {
    const membership = await getActiveOfferingMembership(
      user.id,
      session.offeringId,
    );

    if (!membership || membership.role !== "STUDENT") {
      throw new Error("Student is not enrolled in this offering");
    }
  }

  // 4. create interest record
  // if the record already exists, keep it as it is
  const interest = await db.officeHourInterest.upsert({
    where: {
      userId_sessionId: {
        userId: user.id,
        sessionId: session.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      sessionId: session.id,
    },
  });

  // 5. return result
  return {
    interestId: interest.id,
    userId: user.id,
    sessionId: session.id,
  };
}

export async function getSessionInterestCount(sessionId: number) {
  const { prisma } = await import("../prisma");

  // Count how many students clicked Interested for this office hour session.
  const count = await prisma.officeHourInterest.count({
    where: {
      sessionId: sessionId,
    },
  });

  return {
    sessionId: sessionId,
    interestCount: count,
  };
}
