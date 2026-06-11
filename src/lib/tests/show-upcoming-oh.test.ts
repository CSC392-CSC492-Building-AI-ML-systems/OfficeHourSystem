/**
 * Tests: getTodaySessionsForTeachingTeam()
 *
 * How to run:
 *   npx tsx src/lib/tests/show-upcoming-oh.test.ts
 *
 * Prerequisite: DATABASE_URL must be set in .env
 *
 * Scenarios covered:
 *   1. TA has no offerings → returns empty array
 *   2. TA in an offering → sees today's sessions
 *   3. CANCELLED session today → not returned
 *   4. Session scheduled for tomorrow → not returned
 *   5. User is STUDENT (not TA/INSTRUCTOR) → not returned
 *   6. INSTRUCTOR role → also returned (same as TA)
 */

import "dotenv/config";

import { prisma } from "@/lib/prisma";
import { getTodaySessionsForTeachingTeam } from "@/lib/queries/show-upcoming-oh";
import {
  TEST_PREFIX,
  TEST_TERM,
  cleanupAll,
  assert,
  assertEqual,
  runTest,
  finishTests,
} from "./_seed";

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
async function setupUser(utorid: string, offeringId: number, role: "INSTRUCTOR" | "TA" | "STUDENT") {
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

async function main() {
  console.log("=== show-upcoming-oh.test.ts ===\n");

  await cleanupAll();

  // ── Test 1: TA has no offerings → returns empty array ────────────────────
  await runTest("TA has no offerings → returns empty array", async () => {
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

  // ── Test 2: TA in offering → sees today's sessions ───────────────────────
  await runTest("TA in offering → sees today's sessions", async () => {
    await cleanupAll();

    const { offering } = await setupOffering();
    const ta = await setupUser("ta1", offering.id, "TA");

    // Create a session happening today
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

    const result = await getTodaySessionsForTeachingTeam(ta.id);
    assertEqual(result.length, 1, "should return 1 session");
    assertEqual(result[0].id, session.id, "should return the correct session");
  });

  // ── Test 3: CANCELLED session today → not returned ───────────────────────
  await runTest("CANCELLED session today → not returned", async () => {
    await cleanupAll();

    const { offering } = await setupOffering();
    const ta = await setupUser("ta2", offering.id, "TA");

    // Create a SCHEDULED session and a CANCELLED session, both today
    const { startsAt, endsAt } = makeTodaySession();

    await prisma.officeHourSession.create({
      data: {
        offeringId: offering.id,
        title: "Normal OH",
        type: "REGULAR",
        startsAt,
        endsAt,
        status: "SCHEDULED",
      },
    });

    await prisma.officeHourSession.create({
      data: {
        offeringId: offering.id,
        title: "Cancelled OH",
        type: "REGULAR",
        startsAt,
        endsAt,
        status: "CANCELLED",
      },
    });

    const result = await getTodaySessionsForTeachingTeam(ta.id);

    // Only the SCHEDULED one should appear
    assertEqual(result.length, 1, "cancelled session should not be returned");
    assert(
      result.every((s) => s.status !== "CANCELLED"),
      "no cancelled sessions in result",
    );
  });

  // ── Test 4: Session tomorrow → not returned ───────────────────────────────
  await runTest("Session tomorrow → not returned", async () => {
    await cleanupAll();

    const { offering } = await setupOffering();
    const ta = await setupUser("ta3", offering.id, "TA");

    // Only create a tomorrow session — nothing today
    const { startsAt, endsAt } = makeTomorrowSession();
    await prisma.officeHourSession.create({
      data: {
        offeringId: offering.id,
        title: "Tomorrow OH",
        type: "REGULAR",
        startsAt,
        endsAt,
        status: "SCHEDULED",
      },
    });

    const result = await getTodaySessionsForTeachingTeam(ta.id);
    assertEqual(result.length, 0, "tomorrow session should not be returned");
  });

  // ── Test 5: STUDENT role → not returned ──────────────────────────────────
  await runTest("STUDENT in offering → cannot see sessions via this query", async () => {
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

    // Student is not TA/INSTRUCTOR, so query should return nothing
    const result = await getTodaySessionsForTeachingTeam(student.id);
    assertEqual(result.length, 0, "student should not see sessions");
  });

  // ── Test 6: INSTRUCTOR role → also returned ──────────────────────────────
  await runTest("INSTRUCTOR in offering → also sees today's sessions", async () => {
    await cleanupAll();

    const { offering } = await setupOffering();
    const instructor = await setupUser("instructor1", offering.id, "INSTRUCTOR");

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

    const result = await getTodaySessionsForTeachingTeam(instructor.id);
    assertEqual(result.length, 1, "instructor should see today's sessions");
    assertEqual(result[0].id, session.id, "correct session returned");
  });

  // Cleanup all test data
  await cleanupAll();
  await finishTests();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
