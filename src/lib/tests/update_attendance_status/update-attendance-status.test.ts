/**
 * Tests: updateAttendanceStatus()
 *
 * How to run:
 *   pnpm dlx tsx src/lib/tests/update_attendance_status/update-attendance-status.test.ts
 *
 * Scenarios covered:
 *   1. "end" on IN_HELP student → record created (COMPLETED + helpEndedAt), attendance deleted
 *   2. "no_show" on IN_HELP student → record created (NO_SHOW + helpEndedAt null), attendance deleted
 *   3. "end" with sessionHostId → helpedByHostId recorded in AttendanceRecord
 *   4. Student is WAITING (not IN_HELP) → returns null, nothing changes
 *   5. Non-existent attendanceId → returns null
 *   6. After resolve, same student can re-join the queue (unique constraint no longer blocks)
 */

import "dotenv/config";

import { prisma } from "@/lib/prisma";
import { updateAttendanceStatus } from "@/lib/queries/update_attendance_status/update-attendance-status";
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
    data: { code: `${TEST_PREFIX}UPDATE101` },
  });
  const offering = await prisma.courseOffering.create({
    data: { courseId: course.id, termCode: TEST_TERM },
  });
  const ta = await prisma.user.create({
    data: {
      utorid: `${TEST_PREFIX}ta_update`,
      email: `${TEST_PREFIX}ta_update@mail.utoronto.ca`,
      firstName: "Update",
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
  const start = new Date(now);
  start.setHours(10, 0, 0, 0);
  const end = new Date(now);
  end.setHours(11, 0, 0, 0);
  return prisma.officeHourSession.create({
    data: {
      offeringId,
      title: "Test Session",
      type: "DEBUGGING",
      startsAt: start,
      endsAt: end,
      status: "ACTIVE",
    },
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

// Create an IN_HELP attendance with helpStartedAt already set
async function createInHelpAttendance(studentId: number, sessionId: number) {
  return prisma.officeHourAttendance.create({
    data: {
      sessionId,
      studentId,
      status: "IN_HELP",
      checkedInAt: new Date(Date.now() - 10 * 60 * 1000), // checked in 10 min ago
      helpStartedAt: new Date(Date.now() - 5 * 60 * 1000), // help started 5 min ago
    },
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== update-attendance-status.test.ts ===\n");

  await cleanupAll();

  // ── Test 1: "end" → COMPLETED record created, attendance deleted ──────────
  await runTest(
    '"end" on IN_HELP student → COMPLETED record + attendance deleted',
    async () => {
      await cleanupAll();
      const { offering } = await setupOffering();
      const session = await setupSession(offering.id);
      const student = await setupStudent("end1", offering.id);
      const attendance = await createInHelpAttendance(student.id, session.id);

      const recordPublicId = await updateAttendanceStatus(
        attendance.id,
        "end",
        null,
      );

      assert(recordPublicId !== null, "should return a recordPublicId");

      // Attendance row should be gone
      const deletedAttendance = await prisma.officeHourAttendance.findUnique({
        where: { id: attendance.id },
      });
      assertEqual(deletedAttendance, null, "attendance row should be deleted");

      // Record should exist with correct fields
      const record = await prisma.officeHourAttendanceRecord.findUnique({
        where: { publicId: recordPublicId! },
      });
      assert(record !== null, "record should exist");
      assertEqual(record!.outcome, "COMPLETED", "outcome should be COMPLETED");
      assert(record!.helpEndedAt !== null, "helpEndedAt should be set");
      assertEqual(
        record!.studentId,
        student.id,
        "record should reference correct student",
      );
    },
  );

  // ── Test 2: "no_show" → NO_SHOW record, helpEndedAt null, attendance deleted
  await runTest(
    '"no_show" on IN_HELP student → NO_SHOW record + helpEndedAt null',
    async () => {
      await cleanupAll();
      const { offering } = await setupOffering();
      const session = await setupSession(offering.id);
      const student = await setupStudent("noshow1", offering.id);
      const attendance = await createInHelpAttendance(student.id, session.id);

      const recordPublicId = await updateAttendanceStatus(
        attendance.id,
        "no_show",
        null,
      );

      assert(recordPublicId !== null, "should return a recordPublicId");

      const deletedAttendance = await prisma.officeHourAttendance.findUnique({
        where: { id: attendance.id },
      });
      assertEqual(deletedAttendance, null, "attendance row should be deleted");

      const record = await prisma.officeHourAttendanceRecord.findUnique({
        where: { publicId: recordPublicId! },
      });
      assert(record !== null, "record should exist");
      assertEqual(record!.outcome, "NO_SHOW", "outcome should be NO_SHOW");
      assertEqual(
        record!.helpEndedAt,
        null,
        "helpEndedAt should be null for no-show",
      );
    },
  );

  // ── Test 3: "end" with sessionHostId → helpedByHostId recorded ───────────
  await runTest(
    '"end" with sessionHostId → helpedByHostId written to record',
    async () => {
      await cleanupAll();
      const { offering, ta } = await setupOffering();
      const session = await setupSession(offering.id);
      const student = await setupStudent("end2", offering.id);
      const attendance = await createInHelpAttendance(student.id, session.id);

      // Register the TA as a session host
      const sessionHost = await prisma.officeHourSessionHost.create({
        data: { sessionId: session.id, userId: ta.id, role: "TA" },
      });

      const recordPublicId = await updateAttendanceStatus(
        attendance.id,
        "end",
        sessionHost.id,
      );

      const record = await prisma.officeHourAttendanceRecord.findUnique({
        where: { publicId: recordPublicId! },
      });
      assertEqual(
        record!.helpedByHostId,
        sessionHost.id,
        "helpedByHostId should be set",
      );
    },
  );

  // ── Test 4: Student is WAITING → returns null, nothing changes ───────────
  await runTest(
    "Student is WAITING (not IN_HELP) → returns null, no record created",
    async () => {
      await cleanupAll();
      const { offering } = await setupOffering();
      const session = await setupSession(offering.id);
      const student = await setupStudent("wait1", offering.id);

      const attendance = await prisma.officeHourAttendance.create({
        data: {
          sessionId: session.id,
          studentId: student.id,
          status: "WAITING",
          checkedInAt: new Date(),
        },
      });

      const result = await updateAttendanceStatus(attendance.id, "end", null);

      assertEqual(result, null, "should return null for a WAITING student");

      // Attendance should still be there
      const stillExists = await prisma.officeHourAttendance.findUnique({
        where: { id: attendance.id },
      });
      assert(stillExists !== null, "attendance should still exist");
      assertEqual(
        stillExists!.status,
        "WAITING",
        "status should still be WAITING",
      );

      // No record should have been created
      const records = await prisma.officeHourAttendanceRecord.findMany({
        where: { studentId: student.id },
      });
      assertEqual(records.length, 0, "no record should have been created");
    },
  );

  // ── Test 5: Non-existent attendanceId → returns null ─────────────────────
  await runTest("Non-existent attendanceId → returns null", async () => {
    await cleanupAll();

    const result = await updateAttendanceStatus(-1, "end", null);

    assertEqual(result, null, "should return null for a non-existent id");
  });

  // ── Test 6: After resolve, student can re-join the queue ─────────────────
  await runTest(
    "After END, student can check in again (unique constraint no longer blocks)",
    async () => {
      await cleanupAll();
      const { offering } = await setupOffering();
      const session = await setupSession(offering.id);
      const student = await setupStudent("rejoin1", offering.id);
      const attendance = await createInHelpAttendance(student.id, session.id);

      // End the student's help session
      await updateAttendanceStatus(attendance.id, "end", null);

      // Student should be able to check in again — no unique constraint violation
      let errorThrown = false;
      try {
        await prisma.officeHourAttendance.create({
          data: {
            sessionId: session.id,
            studentId: student.id,
            status: "WAITING",
            checkedInAt: new Date(),
          },
        });
      } catch {
        errorThrown = true;
      }

      assert(
        !errorThrown,
        "student should be able to re-join the queue after being resolved",
      );

      // Confirm the new attendance row exists
      const newAttendance = await prisma.officeHourAttendance.findFirst({
        where: { sessionId: session.id, studentId: student.id },
      });
      assert(newAttendance !== null, "new attendance row should exist");
      assertEqual(
        newAttendance!.status,
        "WAITING",
        "new status should be WAITING",
      );
    },
  );

  await cleanupAll();
  await finishTests();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
