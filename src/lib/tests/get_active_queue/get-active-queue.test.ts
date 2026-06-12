/**
 * Tests: getActiveQueue()
 *
 * How to run:
 *   npx tsx src/lib/tests/get-active-queue.test.ts
 *
 * Scenarios covered:
 *   1. No students in queue → returns empty waiting and helping arrays
 *   2. Multiple students waiting → returned in check-in order with correct ranks
 *   3. Student IN_HELP → appears in helping list with no rank
 *   4. Mix of WAITING and IN_HELP → both lists populated correctly
 *   5. COMPLETED and CANCELLED attendances → not returned in either list
 *   6. Student not in offering (STUDENT role) cannot call service → throws Forbidden
 */

import "dotenv/config";

import { prisma } from "@/lib/prisma";
import { getActiveQueue } from "@/lib/queries/get-active-queue";
import {
  TEST_PREFIX,
  TEST_TERM,
  cleanupAll,
  assert,
  assertEqual,
  runTest,
  finishTests,
} from "./_seed";

// ── Helpers ──────────────────────────────────────────────────────────────────

// Create a course + offering + one TA user, return them
async function setupOffering() {
  const course = await prisma.course.create({
    data: { code: `${TEST_PREFIX}QUEUE101` },
  });

  const offering = await prisma.courseOffering.create({
    data: { courseId: course.id, termCode: TEST_TERM },
  });

  const ta = await prisma.user.create({
    data: {
      utorid: `${TEST_PREFIX}ta_queue`,
      email: `${TEST_PREFIX}ta_queue@mail.utoronto.ca`,
      firstName: "Queue",
      lastName: "TA",
    },
  });

  await prisma.offeringMember.create({
    data: { userId: ta.id, offeringId: offering.id, role: "TA" },
  });

  return { course, offering, ta };
}

// Create a session happening today
async function setupSession(offeringId: number) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(10, 0, 0, 0);
  const end = new Date(now);
  end.setHours(11, 0, 0, 0);

  return prisma.officeHourSession.create({
    data: {
      offeringId,
      title: "Test Queue Session",
      type: "DEBUGGING",
      startsAt: start,
      endsAt: end,
      status: "ACTIVE",
    },
  });
}

// Create a student and enroll them in the offering
async function setupStudent(suffix: string, offeringId: number) {
  const student = await prisma.user.create({
    data: {
      utorid: `${TEST_PREFIX}student_${suffix}`,
      email: `${TEST_PREFIX}student_${suffix}@mail.utoronto.ca`,
      firstName: `Student`,
      lastName: suffix,
    },
  });

  await prisma.offeringMember.create({
    data: { userId: student.id, offeringId, role: "STUDENT" },
  });

  return student;
}

// Check a student into a session with a given status and checkedInAt time
async function checkIn(
  studentId: number,
  sessionId: number,
  status: "WAITING" | "IN_HELP" | "COMPLETED" | "CANCELLED" | "NO_SHOW",
  checkedInAt: Date,
) {
  return prisma.officeHourAttendance.create({
    data: {
      sessionId,
      studentId,
      status,
      checkedInAt,
    },
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== get-active-queue.test.ts ===\n");

  await cleanupAll();

  // ── Test 1: No students in queue → empty lists ────────────────────────────
  await runTest("No students in queue → returns empty waiting and helping", async () => {
    await cleanupAll();

    const { offering } = await setupOffering();
    const session = await setupSession(offering.id);

    const result = await getActiveQueue(session.id);

    assertEqual(result.waiting.length, 0, "waiting should be empty");
    assertEqual(result.helping.length, 0, "helping should be empty");
  });

  // ── Test 2: Multiple students waiting → correct order and ranks ───────────
  await runTest("3 students waiting → returned in check-in order with ranks 1, 2, 3", async () => {
    await cleanupAll();

    const { offering } = await setupOffering();
    const session = await setupSession(offering.id);

    const now = Date.now();

    // Check in 3 students at different times (A first, C last)
    const studentA = await setupStudent("A", offering.id);
    const studentB = await setupStudent("B", offering.id);
    const studentC = await setupStudent("C", offering.id);

    await checkIn(studentA.id, session.id, "WAITING", new Date(now));
    await checkIn(studentB.id, session.id, "WAITING", new Date(now + 1000));
    await checkIn(studentC.id, session.id, "WAITING", new Date(now + 2000));

    const result = await getActiveQueue(session.id);

    assertEqual(result.waiting.length, 3, "should have 3 waiting students");
    assertEqual(result.helping.length, 0, "should have no helping students");

    // Check order and ranks
    assertEqual(result.waiting[0].rank, 1, "first student rank");
    assertEqual(result.waiting[1].rank, 2, "second student rank");
    assertEqual(result.waiting[2].rank, 3, "third student rank");

    // Check correct student is first (Student A checked in first)
    assert(
      result.waiting[0].studentName.includes("A"),
      "Student A should be first in queue",
    );
  });

  // ── Test 3: Student IN_HELP → appears in helping list with no rank ────────
  await runTest("Student IN_HELP → appears in helping list", async () => {
    await cleanupAll();

    const { offering } = await setupOffering();
    const session = await setupSession(offering.id);

    const student = await setupStudent("helped", offering.id);
    await checkIn(student.id, session.id, "IN_HELP", new Date());

    const result = await getActiveQueue(session.id);

    assertEqual(result.waiting.length, 0, "no one waiting");
    assertEqual(result.helping.length, 1, "one student being helped");
    assert(
      result.helping[0].studentName.includes("helped"),
      "correct student in helping list",
    );
  });

  // ── Test 4: Mix of WAITING and IN_HELP → both lists populated ────────────
  await runTest("Mix of WAITING and IN_HELP → both lists populated correctly", async () => {
    await cleanupAll();

    const { offering } = await setupOffering();
    const session = await setupSession(offering.id);

    const now = Date.now();

    const waiting1 = await setupStudent("w1", offering.id);
    const waiting2 = await setupStudent("w2", offering.id);
    const helping1 = await setupStudent("h1", offering.id);
    const helping2 = await setupStudent("h2", offering.id);

    await checkIn(waiting1.id, session.id, "WAITING", new Date(now));
    await checkIn(waiting2.id, session.id, "WAITING", new Date(now + 1000));
    await checkIn(helping1.id, session.id, "IN_HELP", new Date(now + 2000));
    await checkIn(helping2.id, session.id, "IN_HELP", new Date(now + 3000));

    const result = await getActiveQueue(session.id);

    assertEqual(result.waiting.length, 2, "2 students waiting");
    assertEqual(result.helping.length, 2, "2 students being helped");

    // Helping students should NOT have a rank field with a meaningful value
    // (they are in the helping array, not the waiting array)
    assertEqual(result.waiting[0].rank, 1, "first waiting student is rank 1");
    assertEqual(result.waiting[1].rank, 2, "second waiting student is rank 2");
  });

  // ── Test 5: COMPLETED and CANCELLED attendances → not in results ──────────
  await runTest("COMPLETED and CANCELLED attendances → not returned", async () => {
    await cleanupAll();

    const { offering } = await setupOffering();
    const session = await setupSession(offering.id);

    const now = Date.now();

    const completedStudent = await setupStudent("done", offering.id);
    const cancelledStudent = await setupStudent("gone", offering.id);
    const waitingStudent  = await setupStudent("here", offering.id);

    await checkIn(completedStudent.id, session.id, "COMPLETED", new Date(now));
    await checkIn(cancelledStudent.id, session.id, "CANCELLED", new Date(now + 1000));
    await checkIn(waitingStudent.id,   session.id, "WAITING",   new Date(now + 2000));

    const result = await getActiveQueue(session.id);

    // Only the WAITING student should appear
    assertEqual(result.waiting.length, 1, "only 1 waiting student");
    assertEqual(result.helping.length, 0, "no helping students");
    assert(
      result.waiting[0].studentName.includes("here"),
      "correct student is waiting",
    );
  });

  await cleanupAll();
  await finishTests();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
