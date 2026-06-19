/**
 * Tests: getUpcomingSessionsByStudentIdentifier()
 *
 * How to run:
 *   pnpm dlx tsx tests/lib/officeHours.test.ts
 *
 * Prerequisite: DATABASE_URL must be configured in .env or as an environment variable.
 *
 * Scenarios covered:
 *   1. User does not exist (utorid / email both unmatched) → returns empty array
 *   2. Query by utorid → can see non-cancelled sessions within 7 days
 *   3. Query by email → result matches utorid query
 *   4. CANCELLED session → does not appear in results
 *   5. Session starts beyond 7 days → does not appear in results
 *   6. Student not in the offering → cannot see that offering's sessions
 */

import "dotenv/config";

import { prisma } from "@/lib/prisma";
import { getUpcomingSessionsByStudentIdentifier } from "@/lib/queries/officeHours";
import {
  TEST_PREFIX,
  TEST_TERM,
  cleanupAll,
  assert,
  assertEqual,
  runTest,
  finishTests,
} from "./_seed";

/**
 * Build a complete test scenario:
 *   course → offering → session(s) → user → member(STUDENT)
 *
 * Returns the created entities for direct use in test cases.
 */
async function setupScenario() {
  // Create course + offering
  const course = await prisma.course.create({
    data: { code: `${TEST_PREFIX}CSC392H5` },
  });
  const offering = await prisma.courseOffering.create({
    data: { courseId: course.id, termCode: TEST_TERM },
  });

  // Create student user
  const student = await prisma.user.create({
    data: {
      utorid: `${TEST_PREFIX}student1`,
      email: `${TEST_PREFIX}student1@mail.utoronto.ca`,
      studentNumber: "1011662167",
      firstName: "Test",
      lastName: "Student",
    },
  });

  // Enroll student in offering
  await prisma.offeringMember.create({
    data: { userId: student.id, offeringId: offering.id, role: "STUDENT" },
  });

  // Create a normal session starting 2 days from now (within the 7-day window)
  const twoDaysLater = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const twoDaysLaterEnd = new Date(twoDaysLater.getTime() + 60 * 60 * 1000); // +1 hour

  const normalSession = await prisma.officeHourSession.create({
    data: {
      offeringId: offering.id,
      title: "Regular OH",
      type: "REGULAR",
      startsAt: twoDaysLater,
      endsAt: twoDaysLaterEnd,
      status: "SCHEDULED",
    },
  });

  // Create a CANCELLED session (also within 7 days, but should be filtered out)
  const cancelledSession = await prisma.officeHourSession.create({
    data: {
      offeringId: offering.id,
      title: "Cancelled OH",
      type: "REGULAR",
      startsAt: twoDaysLater,
      endsAt: twoDaysLaterEnd,
      status: "CANCELLED",
    },
  });

  // Create a session beyond 7 days (should be filtered out)
  const eightDaysLater = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
  const eightDaysLaterEnd = new Date(eightDaysLater.getTime() + 60 * 60 * 1000);

  const farSession = await prisma.officeHourSession.create({
    data: {
      offeringId: offering.id,
      title: "Far Future OH",
      type: "REGULAR",
      startsAt: eightDaysLater,
      endsAt: eightDaysLaterEnd,
      status: "SCHEDULED",
    },
  });

  return {
    course,
    offering,
    student,
    normalSession,
    cancelledSession,
    farSession,
  };
}

async function main() {
  console.log("=== officeHours.test.ts ===\n");

  await cleanupAll();

  // ── Test 1: user does not exist → returns empty array ────────────────────
  await runTest("User does not exist → returns empty array", async () => {
    const sessions = await getUpcomingSessionsByStudentIdentifier(
      `${TEST_PREFIX}nobody`,
    );
    assertEqual(sessions.length, 0, "sessions length");
  });

  // Set up shared fixture
  const { student, normalSession, cancelledSession } = await setupScenario();

  // ── Test 2: query by utorid ───────────────────────────────────────────────
  await runTest(
    "Query by utorid → returns non-cancelled sessions within 7 days",
    async () => {
      const sessions = await getUpcomingSessionsByStudentIdentifier(
        student.utorid,
      );

      // Only normalSession should appear (cancelled and beyond-7-day sessions filtered)
      assertEqual(sessions.length, 1, "session count");
      assertEqual(sessions[0].id, normalSession.id, "session id");
    },
  );

  // ── Test 3: query by email ────────────────────────────────────────────────
  await runTest("Query by email → result matches utorid query", async () => {
    const sessions = await getUpcomingSessionsByStudentIdentifier(
      student.email!,
    );
    assertEqual(sessions.length, 1, "session count");
    assertEqual(sessions[0].id, normalSession.id, "session id");
  });

  await runTest(
    "Query by student number returns matching sessions",
    async () => {
      const sessions = await getUpcomingSessionsByStudentIdentifier(
        student.studentNumber!,
      );
      assertEqual(sessions.length, 1, "session count");
      assertEqual(sessions[0].id, normalSession.id, "session id");
    },
  );

  // ── Test 4: CANCELLED session should not appear ───────────────────────────
  await runTest("CANCELLED session → not in results", async () => {
    const sessions = await getUpcomingSessionsByStudentIdentifier(
      student.utorid,
    );
    const cancelledIds = sessions.map((s) => s.id);
    assert(
      !cancelledIds.includes(cancelledSession.id),
      "cancelled session should not appear in results",
    );
  });

  // ── Test 5: sessions beyond 7 days should not appear ─────────────────────
  await runTest("Session beyond 7 days → not in results", async () => {
    const sessions = await getUpcomingSessionsByStudentIdentifier(
      student.utorid,
    );
    // normalSession is included; none of the ids should be the one 8 days away
    for (const s of sessions) {
      const startDiff = s.startsAt.getTime() - Date.now();
      assert(
        startDiff <= 7 * 24 * 60 * 60 * 1000,
        `session ${s.id} is outside the 7-day window`,
      );
    }
  });

  // ── Test 6: student not in offering cannot see that offering's sessions ──
  await runTest(
    "Student not in offering → cannot see that offering's sessions",
    async () => {
      // Create a user who does not belong to any offering
      const outsider = await prisma.user.create({
        data: {
          utorid: `${TEST_PREFIX}outsider`,
          email: `${TEST_PREFIX}outsider@mail.utoronto.ca`,
          firstName: "Out",
          lastName: "Sider",
        },
      });

      const sessions = await getUpcomingSessionsByStudentIdentifier(
        outsider.utorid,
      );
      assertEqual(sessions.length, 0, "outsider should not see any sessions");
    },
  );

  // Cleanup
  await cleanupAll();
  await finishTests();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
