import { prisma } from "../prisma";

// example useage
// const result = await markInterestedInSession(
//   "student@mail.utoronto.ca",
//   3,
// );
// console.log(result);

export async function markInterestedInSession(
  identifier: string,
  sessionId: number,
) {
  // input can be utorid or email
  const keyword = identifier.trim();

  // 1. find user by utorid or email
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        {
          utorid: keyword,
        },
        {
          email: keyword,
        },
      ],
    },
  });

  // if user does not exist, stop here
  if (!user) {
    throw new Error("User not found");
  }

  // 2. find the office hour session
  const session = await prisma.officeHourSession.findUnique({
    where: {
      id: sessionId,
    },
  });

  // if session does not exist, stop here
  if (!session) {
    throw new Error("Office hour session not found");
  }

  // 3. check whether this student belongs to this session's offering
  const membership = await prisma.offeringMember.findFirst({
    where: {
      userId: user.id,
      offeringId: session.offeringId,
      role: "STUDENT",
    },
  });

  // if the student is not in this offering, they should not click interested
  if (!membership) {
    throw new Error("Student is not enrolled in this offering");
  }

  // 4. create interest record
  // if the record already exists, keep it as it is
  const interest = await prisma.officeHourInterest.upsert({
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
