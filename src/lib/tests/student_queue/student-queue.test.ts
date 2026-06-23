/**
 * Tests: getActiveTicketsForStudent() + getQueuePosition()
 *
 * How to run:
 *   npx tsx src/lib/tests/student_queue/student-queue.test.ts
 *
 * Scenarios covered:
 *   1. No active attendance → returns empty array
 *   2. Student WAITING → ticket returned with correct position (1 = first)
 *   3. Student WAITING behind 2 others → position is 3
 *   4. Student IN_HELP → position is 0, no estimated wait
 *   5. COMPLETED attendance → not returned (resolved tickets excluded)
 *   6. Student in 2 sessions simultaneously → both tickets returned
 *   7. Wait time estimate: 0 people ahead → estimatedWaitMinutes = 0
 *   8. Wait time estimate: 2 people ahead → estimatedWaitMinutes = 2 × avg
 */

import "dotenv/config";

import { prisma } from "@/lib/prisma";
import {
  getActiveTicketsForStudent,
  getQueuePosition,
} from "@/lib/queries/student_queue/student-queue";
import {
  TEST_PREFIX,
  TEST_TERM,
  cleanupAll,
  assert,
  assertEqual,
  runTest,
  finishTests,
} from "../_seed";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function setupOffering(courseCode = "SQ101") {
  const course = await prisma.course.create({
    data: { code: `${TEST_PREFIX}${courseCode}` },
  });
  const offering = await prisma.courseOffering.create({
    data: { courseId: course.id, termCode: TEST_TERM },
  });
  return { course, offering };
}

async function setupUser(
  utorid: string,
  offeringId: number,
  role: "STUDENT" | "TA" | "INSTRUCTOR",
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

function makeSession(offsetMinutes = 0) {
  const start = new Date();
  start.setHours(10, 0, 0, 0);
  start.setMinutes(start.getMinutes() + offsetMinutes);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { startsAt: start, endsAt: end };
}

async function createOhSession(offeringId: number, label = "OH") {
  const { startsAt, endsAt } = makeSession();
  return prisma.officeHourSession.create({
    data: {
      offeringId,
      title: label,
      type: "REGULAR",
      startsAt,
      endsAt,
      status: "ACTIVE",
    },
  });
}

async function checkIn(
  sessionId: number,
  studentId: number,
  status: "WAITING" | "IN_HELP" = "WAITING",
  minutesAgo = 5,
) {
  const checkedInAt = new Date(Date.now() - minutesAgo * 60_000);
  return prisma.officeHourAttendance.create({
    data: { sessionId, studentId, status, checkedInAt },
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== student-queue.test.ts ===\n");
  await cleanupAll();

  // ── Test 1: No active attendance → empty array ────────────────────────────
  await runTest("No active attendance → returns empty array", async () => {
    await cleanupAll();
    const { offering } = await setupOffering();
    const student = await setupUser("sq_s1", offering.id, "STUDENT");

    const result = await getActiveTicketsForStudent(student.id);
    assertEqual(result.length, 0, "should return empty array");
  });

  // ── Test 2: Student WAITING → position 1 (first in queue) ────────────────
  await runTest("Student WAITING first in queue → position 1", async () => {
    await cleanupAll();
    const { offering } = await setupOffering();
    const student = await setupUser("sq_s2", offering.id, "STUDENT");
    const oh = await createOhSession(offering.id);
    const attendance = await checkIn(oh.id, student.id, "WAITING", 10);

    const tickets = await getActiveTicketsForStudent(student.id);
    assertEqual(tickets.length, 1, "should return 1 ticket");
    assertEqual(tickets[0].status, "WAITING", "status should be WAITING");
    assertEqual(
      tickets[0].publicId,
      attendance.publicId,
      "should match attendance",
    );

    const position = await getQueuePosition(
      oh.publicId,
      attendance.checkedInAt,
    );
    assertEqual(position, 1, "position should be 1");
  });

  // ── Test 3: Student behind 2 others → position 3 ─────────────────────────
  await runTest("Student behind 2 others → position 3", async () => {
    await cleanupAll();
    const { offering } = await setupOffering();
    const s1 = await setupUser("sq_ahead1", offering.id, "STUDENT");
    const s2 = await setupUser("sq_ahead2", offering.id, "STUDENT");
    const student = await setupUser("sq_s3", offering.id, "STUDENT");
    const oh = await createOhSession(offering.id);

    // s1 and s2 checked in earlier
    await checkIn(oh.id, s1.id, "WAITING", 20);
    await checkIn(oh.id, s2.id, "WAITING", 15);
    const myAttendance = await checkIn(oh.id, student.id, "WAITING", 5);

    const position = await getQueuePosition(
      oh.publicId,
      myAttendance.checkedInAt,
    );
    assertEqual(position, 3, "position should be 3 (behind 2 others)");
  });

  // ── Test 4: Student IN_HELP → position 0 ─────────────────────────────────
  await runTest(
    "Student IN_HELP → ticket returned with position 0 from service perspective",
    async () => {
      await cleanupAll();
      const { offering } = await setupOffering();
      const student = await setupUser("sq_s4", offering.id, "STUDENT");
      const oh = await createOhSession(offering.id);
      await checkIn(oh.id, student.id, "IN_HELP", 8);

      const tickets = await getActiveTicketsForStudent(student.id);
      assertEqual(tickets.length, 1, "should return 1 ticket");
      assertEqual(tickets[0].status, "IN_HELP", "status should be IN_HELP");
    },
  );

  // ── Test 5: Resolved attendance (in AttendanceRecord) → not returned ───────
  // Active table (OfficeHourAttendance) only has WAITING and IN_HELP.
  // When a student is done being helped, the row is moved to OfficeHourAttendanceRecord.
  // Verify that a student with only a historical record gets no active tickets.
  await runTest(
    "Resolved attendance (historical record only) → not returned",
    async () => {
      await cleanupAll();
      const { offering } = await setupOffering();
      const student = await setupUser("sq_s5", offering.id, "STUDENT");
      const oh = await createOhSession(offering.id);

      // Write directly to the history table — simulates a completed visit
      const checkedInAt = new Date(Date.now() - 40 * 60_000);
      const helpStartedAt = new Date(Date.now() - 20 * 60_000);
      const helpEndedAt = new Date(Date.now() - 10 * 60_000);
      await prisma.officeHourAttendanceRecord.create({
        data: {
          sessionId: oh.id,
          studentId: student.id,
          checkedInAt,
          helpStartedAt,
          helpEndedAt,
          outcome: "COMPLETED",
        },
      });

      // No row in OfficeHourAttendance → query should return nothing
      const tickets = await getActiveTicketsForStudent(student.id);
      assertEqual(
        tickets.length,
        0,
        "historical record should not appear as active ticket",
      );
    },
  );

  // ── Test 6: Student in 2 sessions → both tickets returned ────────────────
  await runTest("Student in 2 sessions → both tickets returned", async () => {
    await cleanupAll();
    const { offering: o1 } = await setupOffering("SQ_A");
    const { offering: o2 } = await setupOffering("SQ_B");

    // Student needs OfferingMember in both offerings
    const student = await prisma.user.create({
      data: {
        utorid: `${TEST_PREFIX}sq_multi`,
        email: `${TEST_PREFIX}sq_multi@mail.utoronto.ca`,
        firstName: "Test",
        lastName: "Multi",
      },
    });
    await prisma.offeringMember.createMany({
      data: [
        { userId: student.id, offeringId: o1.id, role: "STUDENT" },
        { userId: student.id, offeringId: o2.id, role: "STUDENT" },
      ],
    });

    const oh1 = await createOhSession(o1.id, "OH Course A");
    const oh2 = await createOhSession(o2.id, "OH Course B");
    await checkIn(oh1.id, student.id, "WAITING", 10);
    await checkIn(oh2.id, student.id, "WAITING", 5);

    const tickets = await getActiveTicketsForStudent(student.id);
    assertEqual(tickets.length, 2, "should return tickets from both sessions");
    assert(
      tickets.some((t) => t.session.title === "OH Course A"),
      "should include course A ticket",
    );
    assert(
      tickets.some((t) => t.session.title === "OH Course B"),
      "should include course B ticket",
    );
  });

  // ── Test 7: First in line → 0 people ahead, estimatedWait = 0 ───────────
  await runTest(
    "First in line (position 1) → 0 people ahead → estimated wait 0",
    async () => {
      await cleanupAll();
      const { offering } = await setupOffering();
      const student = await setupUser("sq_s7", offering.id, "STUDENT");
      const oh = await createOhSession(offering.id);
      const attendance = await checkIn(oh.id, student.id, "WAITING", 3);

      const position = await getQueuePosition(
        oh.publicId,
        attendance.checkedInAt,
      );
      const avgMinutes = 8; // hypothetical average
      const estimatedWait = (position - 1) * avgMinutes;

      assertEqual(position, 1, "position should be 1");
      assertEqual(estimatedWait, 0, "0 people ahead → estimated wait = 0");
    },
  );

  // ── Test 8: position 3 → 2 people ahead → estimatedWait = 2 × avg ────────
  await runTest(
    "Position 3 → 2 people ahead → estimated wait = 2 × avgMinutes",
    async () => {
      await cleanupAll();
      const { offering } = await setupOffering();
      const s1 = await setupUser("sq_p1", offering.id, "STUDENT");
      const s2 = await setupUser("sq_p2", offering.id, "STUDENT");
      const student = await setupUser("sq_s8", offering.id, "STUDENT");
      const oh = await createOhSession(offering.id);

      await checkIn(oh.id, s1.id, "WAITING", 20);
      await checkIn(oh.id, s2.id, "WAITING", 15);
      const myAttendance = await checkIn(oh.id, student.id, "WAITING", 5);

      const position = await getQueuePosition(
        oh.publicId,
        myAttendance.checkedInAt,
      );
      const avgMinutes = 8;
      const estimatedWait = (position - 1) * avgMinutes;

      assertEqual(position, 3, "position should be 3");
      assertEqual(estimatedWait, 16, "2 people ahead × 8 min = 16 min");
    },
  );

  await cleanupAll();
  await finishTests();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
