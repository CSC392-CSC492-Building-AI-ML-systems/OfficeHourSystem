/**
 * Tests: startHelping()
 *
 * How to run:
 *   npx tsx src/lib/tests/start_helping/start-helping.test.ts
 *
 * Scenarios covered:
 *   1. WAITING student → moved to IN_HELP, helpStartedAt set, publicId returned
 *   2. WAITING student with a registered session host → helpedByHostId recorded
 *   3. Student already IN_HELP → returns null (atomic guard blocks double-start)
 *   4. Student with an existing AttendanceRecord (resolved) → cannot be re-started via attendance table
 *   5. Starting student A does not affect student B (isolation)
 */

import "dotenv/config";

import { prisma } from "@/lib/prisma";
import { startHelping } from "@/lib/queries/start_helping/start-helping";
import {
  TEST_PREFIX,
  TEST_TERM,
  cleanupAll,
  assert,
  assertEqual,
  runTest,
  finishTests,
} from "../_seed";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function setupOffering() {
  const course = await prisma.course.create({
    data: { code: `${TEST_PREFIX}START101` },
  });
  const offering = await prisma.courseOffering.create({
    data: { courseId: course.id, termCode: TEST_TERM },
  });
  const ta = await prisma.user.create({
    data: {
      utorid: `${TEST_PREFIX}ta_start`,
      email: `${TEST_PREFIX}ta_start@mail.utoronto.ca`,
      firstName: "Start",
      lastName: "TA",
    },
  });
  await prisma.offeringMember.create({
    data: { userId: ta.id, offeringId: offering.id, role: "TA" },
  });
  return { offering, ta };
}

async function setupSession(offeringId: number) {
  const now = new Date();
  const start = new Date(now); start.setHours(10, 0, 0, 0);
  const end   = new Date(now); end.setHours(11, 0, 0, 0);
  return prisma.officeHourSession.create({
    data: { offeringId, title: "Test Session", type: "DEBUGGING", startsAt: start, endsAt: end, status: "ACTIVE" },
  });
}

async function setupStudent(suffix: string, offeringId: number) {
  const student = await prisma.user.create({
    data: {
      utorid: `${TEST_PREFIX}student_${suffix}`,
      email: `${TEST_PREFIX}student_${suffix}@mail.utoronto.ca`,
      firstName: "Student",
      lastName: suffix,
    },
  });
  await prisma.offeringMember.create({
    data: { userId: student.id, offeringId, role: "STUDENT" },
  });
  return student;
}

async function checkIn(studentId: number, sessionId: number, status: "WAITING" | "IN_HELP") {
  return prisma.officeHourAttendance.create({
    data: { sessionId, studentId, status, checkedInAt: new Date() },
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== start-helping.test.ts ===\n");

  await cleanupAll();

  // ── Test 1: WAITING → IN_HELP, fields updated correctly ──────────────────
  await runTest("WAITING student → IN_HELP, publicId returned, helpStartedAt set", async () => {
    await cleanupAll();
    const { offering } = await setupOffering();
    const session = await setupSession(offering.id);
    const student = await setupStudent("w1", offering.id);
    const attendance = await checkIn(student.id, session.id, "WAITING");

    const publicId = await startHelping(attendance.id, null);

    assert(publicId !== null, "should return a publicId");

    // Verify DB state
    const updated = await prisma.officeHourAttendance.findUnique({
      where: { id: attendance.id },
    });
    assertEqual(updated?.status, "IN_HELP", "status should be IN_HELP");
    assert(updated?.helpStartedAt !== null, "helpStartedAt should be set");
    assertEqual(updated?.helpedByHostId, null, "helpedByHostId should be null when no session host");
  });

  // ── Test 2: With a registered session host → helpedByHostId recorded ──────
  await runTest("WAITING student + session host → helpedByHostId recorded", async () => {
    await cleanupAll();
    const { offering, ta } = await setupOffering();
    const session = await setupSession(offering.id);
    const student = await setupStudent("w2", offering.id);
    const attendance = await checkIn(student.id, session.id, "WAITING");

    // Register the TA as a session host
    const sessionHost = await prisma.officeHourSessionHost.create({
      data: { sessionId: session.id, userId: ta.id, role: "TA" },
    });

    const publicId = await startHelping(attendance.id, sessionHost.id);

    assert(publicId !== null, "should return a publicId");

    const updated = await prisma.officeHourAttendance.findUnique({
      where: { id: attendance.id },
    });
    assertEqual(updated?.helpedByHostId, sessionHost.id, "helpedByHostId should point to session host");
  });

  // ── Test 3: Already IN_HELP → atomic guard blocks it, returns null ────────
  await runTest("Student already IN_HELP → returns null", async () => {
    await cleanupAll();
    const { offering } = await setupOffering();
    const session = await setupSession(offering.id);
    const student = await setupStudent("h1", offering.id);
    const attendance = await checkIn(student.id, session.id, "IN_HELP");

    const publicId = await startHelping(attendance.id, null);

    assertEqual(publicId, null, "should return null when student is already IN_HELP");

    // Status should be unchanged
    const unchanged = await prisma.officeHourAttendance.findUnique({
      where: { id: attendance.id },
    });
    assertEqual(unchanged?.status, "IN_HELP", "status should still be IN_HELP");
  });

  // ── Test 4: Resolved student (in AttendanceRecord, no active attendance) ──
  await runTest("Resolved student has no active attendance → startHelping with invalid id returns null", async () => {
    await cleanupAll();
    const { offering } = await setupOffering();
    const session = await setupSession(offering.id);
    const student = await setupStudent("done1", offering.id);

    // Simulate a resolved student: write to record table, no row in attendance table
    await prisma.officeHourAttendanceRecord.create({
      data: {
        sessionId: session.id,
        studentId: student.id,
        checkedInAt: new Date(),
        outcome: "COMPLETED",
      },
    });

    // Calling startHelping with a non-existent attendanceId returns null
    const publicId = await startHelping(-1, null);

    assertEqual(publicId, null, "should return null for a non-existent attendance id");
  });

  // ── Test 5: Starting student A does not affect student B ─────────────────
  await runTest("Starting student A leaves student B untouched", async () => {
    await cleanupAll();
    const { offering } = await setupOffering();
    const session = await setupSession(offering.id);
    const studentA = await setupStudent("iso_a", offering.id);
    const studentB = await setupStudent("iso_b", offering.id);
    const attendanceA = await checkIn(studentA.id, session.id, "WAITING");
    const attendanceB = await checkIn(studentB.id, session.id, "WAITING");

    await startHelping(attendanceA.id, null);

    const b = await prisma.officeHourAttendance.findUnique({ where: { id: attendanceB.id } });
    assertEqual(b?.status, "WAITING", "student B should still be WAITING");
  });

  await cleanupAll();
  await finishTests();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
