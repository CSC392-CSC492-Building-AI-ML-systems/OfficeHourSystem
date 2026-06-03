/**
 * Tests: markInterestedInSession() / getSessionInterestCount()
 *
 * How to run:
 *   npx tsx tests/lib/interest.test.ts
 *
 * Prerequisite: DATABASE_URL must be configured in .env or as an environment variable.
 *
 * Scenarios covered:
 *   1. User does not exist        → throw "User not found"
 *   2. Session does not exist     → throw "Office hour session not found"
 *   3. Student not in offering    → throw "Student is not enrolled in this offering"
 *   4. Normal interest mark       → returns interestId / userId / sessionId
 *   5. Duplicate mark             → idempotent, no error, returns same record id
 *   6. getSessionInterestCount    → correctly reflects number of interested students
 */

// Must be the first import to ensure DATABASE_URL is injected before the prisma.ts module loads
import "dotenv/config";

import { prisma } from "@/lib/prisma";
import {
  markInterestedInSession,
  getSessionInterestCount,
} from "@/lib/queries/officehourInterest";
import {
  TEST_PREFIX,
  TEST_TERM,
  cleanupAll,
  assert,
  assertEqual,
  runTest,
  finishTests,
} from "./_seed";

// Test Fixture Setup

/**
 * Build a minimal scenario:
 *   course → offering → session → student (inside offering) + outsider (not in offering)
 */
async function setupScenario() {
  const course = await prisma.course.create({
    data: { code: `${TEST_PREFIX}CSC392H5` },
  });
  const offering = await prisma.courseOffering.create({
    data: { courseId: course.id, termCode: TEST_TERM },
  });

  // Student enrolled in the offering
  const student = await prisma.user.create({
    data: {
      utorid: `${TEST_PREFIX}student1`,
      email: `${TEST_PREFIX}student1@mail.utoronto.ca`,
      studentNumber: "1011662167",
      firstName: "Alice",
      lastName: "Test",
    },
  });
  await prisma.offeringMember.create({
    data: { userId: student.id, offeringId: offering.id, role: "STUDENT" },
  });

  // Second student, used for testing the count
  const student2 = await prisma.user.create({
    data: {
      utorid: `${TEST_PREFIX}student2`,
      email: `${TEST_PREFIX}student2@mail.utoronto.ca`,
      studentNumber: "1011662168",
      firstName: "Bob",
      lastName: "Test",
    },
  });
  await prisma.offeringMember.create({
    data: { userId: student2.id, offeringId: offering.id, role: "STUDENT" },
  });

  // User not enrolled in this offering (outsider)
  const outsider = await prisma.user.create({
    data: {
      utorid: `${TEST_PREFIX}outsider`,
      email: `${TEST_PREFIX}outsider@mail.utoronto.ca`,
      firstName: "Out",
      lastName: "Sider",
    },
  });

  // Create a session
  const twoDaysLater = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const session = await prisma.officeHourSession.create({
    data: {
      offeringId: offering.id,
      title: "Test OH",
      type: "REGULAR",
      startsAt: twoDaysLater,
      endsAt: new Date(twoDaysLater.getTime() + 60 * 60 * 1000),
      status: "SCHEDULED",
    },
  });

  return { offering, student, student2, outsider, session };
}

async function main() {
  console.log("=== interest.test.ts ===\n");

  await cleanupAll();
  const { student, student2, outsider, session } = await setupScenario();

  // Test 1: user does not exist should throw
  await runTest("User does not exist → throw 'User not found'", async () => {
    let errorMsg = "";
    try {
      await markInterestedInSession(`${TEST_PREFIX}nobody`, session.id);
    } catch (e) {
      errorMsg = (e as Error).message;
    }
    assert(
      errorMsg.includes("User not found"),
      `Error message should contain 'User not found', got: ${errorMsg}`,
    );
  });

  // Test 2: session does not exist -> throw
  await runTest(
    "Session does not exist → throw 'Office hour session not found'",
    async () => {
      let errorMsg = "";
      try {
        await markInterestedInSession(student.utorid, 999999999);
      } catch (e) {
        errorMsg = (e as Error).message;
      }
      assert(
        errorMsg.includes("Office hour session not found"),
        `Error message should contain 'Office hour session not found', got: ${errorMsg}`,
      );
    },
  );

  // Test 3: student not in offering -> throw sth
  await runTest(
    "Student not in offering → throw 'Student is not enrolled'",
    async () => {
      let errorMsg = "";
      try {
        await markInterestedInSession(outsider.utorid, session.id);
      } catch (e) {
        errorMsg = (e as Error).message;
      }
      assert(
        errorMsg.includes("Student is not enrolled in this offering"),
        `Error message should contain 'Student is not enrolled', got: ${errorMsg}`,
      );
    },
  );

  // Test 4: normal interest mark
  await runTest(
    "Normal mark → returns interestId / userId / sessionId",
    async () => {
      const result = await markInterestedInSession(student.utorid, session.id);

      assert(
        typeof result.interestId === "number",
        "interestId should be a number",
      );
      assertEqual(result.userId, student.id, "userId");
      assertEqual(result.sessionId, session.id, "sessionId");
    },
  );

  await runTest("Mark by student number returns interest result", async () => {
    const result = await markInterestedInSession(
      student2.studentNumber!,
      session.id,
    );

    assert(
      typeof result.interestId === "number",
      "interestId should be a number",
    );
    assertEqual(result.userId, student2.id, "userId");
    assertEqual(result.sessionId, session.id, "sessionId");
  });

  // Test 5: duplicate mark → idempotent
  await runTest(
    "Duplicate mark → idempotent, returns same record",
    async () => {
      // student already marked in test 4, marking again should not throw
      const first = await markInterestedInSession(student.utorid, session.id);
      const second = await markInterestedInSession(student.utorid, session.id);

      // upsert semantics: same record, id unchanged
      assertEqual(
        first.interestId,
        second.interestId,
        "Both marks should return the same interestId",
      );
    },
  );

  // ── Test 6: getSessionInterestCount ──────────────────────────────────────
  await runTest(
    "getSessionInterestCount → correctly reflects number of interested students",
    async () => {
      // student1 and student2 have marked interest so far
      const before = await getSessionInterestCount(session.id);
      assertEqual(
        before.interestCount,
        2,
        "count should be 2 before duplicate mark",
      );

      // student2 marks interest again through utorid; this should be idempotent.
      await markInterestedInSession(student2.utorid, session.id);

      const after = await getSessionInterestCount(session.id);
      assertEqual(
        after.interestCount,
        2,
        "count should stay 2 after duplicate mark",
      );
      assertEqual(
        after.sessionId,
        session.id,
        "returned sessionId should match",
      );
    },
  );

  // cleanup
  await cleanupAll();
  await finishTests();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
