/**
 * Tests: getTodaySessionsForTeachingTeam()
 *
 * How to run:
 *   pnpm dlx tsx src/lib/tests/show_upcoming_oh/show-upcoming-oh.test.ts
 *
 * Prerequisite: DATABASE_URL must be set in .env
 *
 * Scenarios covered:
 *   1. User in no offering → returns empty array
 *   2. TA hosting a today session → sees it
 *   3. CANCELLED session the TA hosts → returned (shown in Ended tab)
 *   4. COMPLETED session the TA hosts → returned (shown in Ended tab)
 *   5. Session scheduled for tomorrow → not returned (even if hosted)
 *   6. STUDENT → not returned
 *   7. INSTRUCTOR → sees every session in their offering (host or not)
 *   8. TA in the offering but NOT a host of the session → not returned
 */

import "dotenv/config";

import { prisma } from "@/lib/prisma";
import { getTodaySessionsForTeachingTeam } from "@/lib/queries/show_upcoming_oh/show-upcoming-oh";
import {
  TEST_PREFIX,
  TEST_TERM,
  cleanupAll,
  assert,
  assertEqual,
  runTest,
  finishTests,
} from "../_seed";

// Helper: create a session that starts today
function makeTodaySession(offsetMinutes = 0) {
  const start = new Date();
  start.setHours(10, 0, 0, 0); // 10:00 AM today
  start.setMinutes(start.getMinutes() + offsetMinutes);

  const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour
  return { startsAt: start, endsAt: end };
}

// Helper: create a session that starts tomorrow
function makeTomorrowSession() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(10, 0, 0, 0);

  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { startsAt: start, endsAt: end };
}

// Set up a basic course + offering
async function setupOffering() {
  const course = await prisma.course.create({
    data: { code: `${TEST_PREFIX}OH101` },
  });

  const offering = await prisma.courseOffering.create({
    data: { courseId: course.id, termCode: TEST_TERM },
  });

  return { course, offering };
}

// Create a user and add them to the offering with a given role
async function setupUser(
  utorid: string,
  offeringId: number,
  role: "INSTRUCTOR" | "TA" | "STUDENT",
) {
  const user = await prisma.user.create({
    data: {
      utorid: `${TEST_PREFIX}${utorid}`,
      email: `${TEST_PREFIX}${utorid}@mail.utoronto.ca`,
      firstName: "Test",
      lastName: utorid,
    },
  });

  await prisma.offeringMember.create({
    data: { userId: user.id, offeringId, role },
  });

  return user;
}

// Register a user as a host of a specific session
async function addHost(
  sessionId: number,
  userId: number,
  role: "INSTRUCTOR" | "TA",
) {
  await prisma.officeHourSessionHost.create({
    data: { sessionId, userId, role },
  });
}

async function main() {
  console.log("=== show-upcoming-oh.test.ts ===\n");

  await cleanupAll();

  // ── Test 1: User in no offering → returns empty array ────────────────────
  await runTest("user in no offering → returns empty array", async () => {
    await cleanupAll();

    // Create a user but do NOT add them to any offering
    const loneUser = await prisma.user.create({
      data: {
        utorid: `${TEST_PREFIX}lone_ta`,
        email: `${TEST_PREFIX}lone_ta@mail.utoronto.ca`,
        firstName: "Lone",
        lastName: "TA",
      },
    });

    const result = await getTodaySessionsForTeachingTeam(loneUser.id);
    assertEqual(result.length, 0, "should return empty array");
  });

  // ── Test 2: TA hosting a today session → sees it ─────────────────────────
  await runTest("TA hosting a today session → sees it", async () => {
    await cleanupAll();

    const { offering } = await setupOffering();
    const ta = await setupUser("ta1", offering.id, "TA");

    const { startsAt, endsAt } = makeTodaySession();
    const session = await prisma.officeHourSession.create({
      data: {
        offeringId: offering.id,
        title: "Today OH",
        type: "REGULAR",
        startsAt,
        endsAt,
        status: "SCHEDULED",
      },
    });
    await addHost(session.id, ta.id, "TA");

    const result = await getTodaySessionsForTeachingTeam(ta.id);
    assertEqual(result.length, 1, "should return 1 session");
    assertEqual(result[0].id, session.id, "should return the correct session");
  });

  // ── Test 3: CANCELLED session the TA hosts → returned (Ended tab) ────────
  await runTest("CANCELLED session the TA hosts → returned", async () => {
    await cleanupAll();

    const { offering } = await setupOffering();
    const ta = await setupUser("ta2", offering.id, "TA");

    const { startsAt, endsAt } = makeTodaySession();

    const scheduled = await prisma.officeHourSession.create({
      data: {
        offeringId: offering.id,
        title: "Normal OH",
        type: "REGULAR",
        startsAt,
        endsAt,
        status: "SCHEDULED",
      },
    });
    const cancelled = await prisma.officeHourSession.create({
      data: {
        offeringId: offering.id,
        title: "Cancelled OH",
        type: "REGULAR",
        startsAt,
        endsAt,
        status: "CANCELLED",
      },
    });
    await addHost(scheduled.id, ta.id, "TA");
    await addHost(cancelled.id, ta.id, "TA");

    const result = await getTodaySessionsForTeachingTeam(ta.id);

    // Both should appear — frontend buckets the cancelled one into the Ended tab
    assertEqual(
      result.length,
      2,
      "both SCHEDULED and CANCELLED sessions should be returned",
    );
    assert(
      result.some((s) => s.status === "CANCELLED"),
      "CANCELLED session should be in results",
    );
    assert(
      result.some((s) => s.status === "SCHEDULED"),
      "SCHEDULED session should be in results",
    );
  });

  // ── Test 4: COMPLETED session the TA hosts → returned (Ended tab) ─────────
  await runTest("COMPLETED session the TA hosts → returned", async () => {
    await cleanupAll();

    const { offering } = await setupOffering();
    const ta = await setupUser("ta_comp", offering.id, "TA");

    const { startsAt, endsAt } = makeTodaySession();

    const scheduled = await prisma.officeHourSession.create({
      data: {
        offeringId: offering.id,
        title: "Upcoming OH",
        type: "REGULAR",
        startsAt,
        endsAt,
        status: "SCHEDULED",
      },
    });
    const completed = await prisma.officeHourSession.create({
      data: {
        offeringId: offering.id,
        title: "Ended OH",
        type: "REGULAR",
        startsAt,
        endsAt,
        status: "COMPLETED",
      },
    });
    await addHost(scheduled.id, ta.id, "TA");
    await addHost(completed.id, ta.id, "TA");

    const result = await getTodaySessionsForTeachingTeam(ta.id);

    // Both should appear — frontend separates them into tabs
    assertEqual(
      result.length,
      2,
      "both SCHEDULED and COMPLETED sessions should be returned",
    );
    assert(
      result.some((s) => s.status === "COMPLETED"),
      "COMPLETED session should be in results",
    );
    assert(
      result.some((s) => s.status === "SCHEDULED"),
      "SCHEDULED session should be in results",
    );
  });

  // ── Test 5: Session tomorrow → not returned (even if hosted) ──────────────
  await runTest("Session tomorrow → not returned", async () => {
    await cleanupAll();

    const { offering } = await setupOffering();
    const ta = await setupUser("ta3", offering.id, "TA");

    // Only create a tomorrow session — nothing today
    const { startsAt, endsAt } = makeTomorrowSession();
    const session = await prisma.officeHourSession.create({
      data: {
        offeringId: offering.id,
        title: "Tomorrow OH",
        type: "REGULAR",
        startsAt,
        endsAt,
        status: "SCHEDULED",
      },
    });
    await addHost(session.id, ta.id, "TA");

    const result = await getTodaySessionsForTeachingTeam(ta.id);
    assertEqual(result.length, 0, "tomorrow session should not be returned");
  });

  // ── Test 6: STUDENT role → not returned ──────────────────────────────────
  await runTest(
    "STUDENT in offering → cannot see sessions via this query",
    async () => {
      await cleanupAll();

      const { offering } = await setupOffering();
      const student = await setupUser("student1", offering.id, "STUDENT");

      // Create a today session
      const { startsAt, endsAt } = makeTodaySession();
      await prisma.officeHourSession.create({
        data: {
          offeringId: offering.id,
          title: "Today OH",
          type: "REGULAR",
          startsAt,
          endsAt,
          status: "SCHEDULED",
        },
      });

      // Student is not an instructor and hosts nothing → returns nothing
      const result = await getTodaySessionsForTeachingTeam(student.id);
      assertEqual(result.length, 0, "student should not see sessions");
    },
  );

  // ── Test 7: INSTRUCTOR → sees every session in their offering, host or not ─
  await runTest(
    "INSTRUCTOR sees every session in their offering without a host row",
    async () => {
      await cleanupAll();

      const { offering } = await setupOffering();
      const instructor = await setupUser(
        "instructor1",
        offering.id,
        "INSTRUCTOR",
      );

      const { startsAt, endsAt } = makeTodaySession();
      const session = await prisma.officeHourSession.create({
        data: {
          offeringId: offering.id,
          title: "Instructor OH",
          type: "REGULAR",
          startsAt,
          endsAt,
          status: "SCHEDULED",
        },
      });
      // No host row added — instructor still sees it.

      const result = await getTodaySessionsForTeachingTeam(instructor.id);
      assertEqual(result.length, 1, "instructor should see today's sessions");
      assertEqual(result[0].id, session.id, "correct session returned");
    },
  );

  // ── Test 8: TA in offering but NOT host of the session → not returned ─────
  await runTest(
    "TA in offering but not host of the session → not returned",
    async () => {
      await cleanupAll();

      const { offering } = await setupOffering();
      const ta = await setupUser("ta_nonhost", offering.id, "TA");

      const { startsAt, endsAt } = makeTodaySession();
      await prisma.officeHourSession.create({
        data: {
          offeringId: offering.id,
          title: "Someone else's OH",
          type: "REGULAR",
          startsAt,
          endsAt,
          status: "SCHEDULED",
        },
      });
      // TA is in the teaching team but is NOT a host of this session.

      const result = await getTodaySessionsForTeachingTeam(ta.id);
      assertEqual(result.length, 0, "non-host TA should not see the session");
    },
  );

  // ── Test 9: scoped to offering → INSTRUCTOR sees all its sessions ──────────
  await runTest(
    "scoped to offering → INSTRUCTOR sees its sessions without hosting",
    async () => {
      await cleanupAll();
      const { offering } = await setupOffering();
      const instr = await setupUser("scoped_instr", offering.id, "INSTRUCTOR");

      const { startsAt, endsAt } = makeTodaySession();
      const s = await prisma.officeHourSession.create({
        data: {
          offeringId: offering.id,
          title: "Scoped OH",
          type: "REGULAR",
          startsAt,
          endsAt,
          status: "SCHEDULED",
        },
      });
      // No host row for the instructor.

      const result = await getTodaySessionsForTeachingTeam(instr.id, {
        offeringId: offering.id,
        isInstructor: true,
      });
      assertEqual(result.length, 1, "instructor sees the session");
      assertEqual(result[0].id, s.id, "correct session");
    },
  );

  // ── Test 10: scoped to offering A → excludes offering B ───────────────────
  await runTest("scoped to offering A → excludes offering B", async () => {
    await cleanupAll();
    const { offering: offeringA } = await setupOffering();
    const courseB = await prisma.course.create({
      data: { code: `${TEST_PREFIX}OH_B` },
    });
    const offeringB = await prisma.courseOffering.create({
      data: { courseId: courseB.id, termCode: TEST_TERM },
    });
    const instr = await setupUser("scoped_ab", offeringA.id, "INSTRUCTOR");
    await prisma.offeringMember.create({
      data: { userId: instr.id, offeringId: offeringB.id, role: "INSTRUCTOR" },
    });

    const { startsAt, endsAt } = makeTodaySession();
    await prisma.officeHourSession.create({
      data: {
        offeringId: offeringA.id,
        title: "A OH",
        type: "REGULAR",
        startsAt,
        endsAt,
        status: "SCHEDULED",
      },
    });
    await prisma.officeHourSession.create({
      data: {
        offeringId: offeringB.id,
        title: "B OH",
        type: "REGULAR",
        startsAt,
        endsAt,
        status: "SCHEDULED",
      },
    });

    const result = await getTodaySessionsForTeachingTeam(instr.id, {
      offeringId: offeringA.id,
      isInstructor: true,
    });
    assertEqual(result.length, 1, "only offering A session");
    assert(
      result.every((r) => r.offeringId === offeringA.id),
      "all results belong to offering A",
    );
  });

  // ── Test 11: scoped to offering → TA sees only sessions they host in it ────
  await runTest(
    "scoped to offering → TA sees only sessions they host in it",
    async () => {
      await cleanupAll();
      const { offering } = await setupOffering();
      const ta = await setupUser("scoped_ta", offering.id, "TA");

      const { startsAt, endsAt } = makeTodaySession();
      const hosted = await prisma.officeHourSession.create({
        data: {
          offeringId: offering.id,
          title: "Hosted",
          type: "REGULAR",
          startsAt,
          endsAt,
          status: "SCHEDULED",
        },
      });
      await prisma.officeHourSession.create({
        data: {
          offeringId: offering.id,
          title: "Not hosted",
          type: "REGULAR",
          startsAt,
          endsAt,
          status: "SCHEDULED",
        },
      });
      await addHost(hosted.id, ta.id, "TA");

      const result = await getTodaySessionsForTeachingTeam(ta.id, {
        offeringId: offering.id,
        isInstructor: false,
      });
      assertEqual(result.length, 1, "only the hosted session");
      assertEqual(result[0].id, hosted.id, "correct hosted session");
    },
  );

  // ── Test 12: scoped → TA hosting only in another offering sees nothing ────
  await runTest(
    "scoped to offering → TA who hosts only elsewhere sees nothing",
    async () => {
      await cleanupAll();
      const { offering: offeringA } = await setupOffering();
      const courseB = await prisma.course.create({
        data: { code: `${TEST_PREFIX}OH_B2` },
      });
      const offeringB = await prisma.courseOffering.create({
        data: { courseId: courseB.id, termCode: TEST_TERM },
      });
      const ta = await setupUser("scoped_ta2", offeringA.id, "TA");
      await prisma.offeringMember.create({
        data: { userId: ta.id, offeringId: offeringB.id, role: "TA" },
      });

      const { startsAt, endsAt } = makeTodaySession();
      const bSession = await prisma.officeHourSession.create({
        data: {
          offeringId: offeringB.id,
          title: "B hosted",
          type: "REGULAR",
          startsAt,
          endsAt,
          status: "SCHEDULED",
        },
      });
      await addHost(bSession.id, ta.id, "TA");
      await prisma.officeHourSession.create({
        data: {
          offeringId: offeringA.id,
          title: "A OH",
          type: "REGULAR",
          startsAt,
          endsAt,
          status: "SCHEDULED",
        },
      });

      const result = await getTodaySessionsForTeachingTeam(ta.id, {
        offeringId: offeringA.id,
        isInstructor: false,
      });
      assertEqual(result.length, 0, "nothing in offering A");
    },
  );

  // Cleanup all test data
  await cleanupAll();
  await finishTests();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
