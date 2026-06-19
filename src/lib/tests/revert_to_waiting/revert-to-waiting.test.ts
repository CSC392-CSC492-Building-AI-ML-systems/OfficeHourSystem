/**
 * Tests: revertToWaiting()
 *
 * How to run:
 *   pnpm dlx tsx src/lib/tests/revert_to_waiting/revert-to-waiting.test.ts
 *
 * Scenarios covered:
 *   1. IN_HELP student → reverted to WAITING, helpStartedAt and helpedByHostId cleared
 *   2. Student already WAITING → returns null (atomic guard, no-op)
 *   3. Resolved student (no active attendance row) → revertToWaiting with invalid id returns null
 *   4. Reverting one student does not affect other IN_HELP students (isolation)
 *   5. Queue position preserved: checkedInAt unchanged, student returns to correct rank
 */

import "dotenv/config";

import { prisma } from "@/lib/prisma";
import { revertToWaiting } from "@/lib/queries/revert_to_waiting/revert-to-waiting";
import { getActiveQueue } from "@/lib/queries/get_active_queue/get-active-queue";
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
    data: { code: `${TEST_PREFIX}REVERT101` },
  });
  const offering = await prisma.courseOffering.create({
    data: { courseId: course.id, termCode: TEST_TERM },
  });
  return { offering };
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

// ── Tests ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== revert-to-waiting.test.ts ===\n");

  await cleanupAll();

  // ── Test 1: IN_HELP → WAITING, fields cleared ────────────────────────────
  await runTest(
    "IN_HELP student → reverted to WAITING, helpStartedAt and helpedByHostId cleared",
    async () => {
      await cleanupAll();
      const { offering } = await setupOffering();
      const session = await setupSession(offering.id);
      const student = await setupStudent("rev1", offering.id);

      // Create an IN_HELP record with a helpStartedAt value
      const attendance = await prisma.officeHourAttendance.create({
        data: {
          sessionId: session.id,
          studentId: student.id,
          status: "IN_HELP",
          checkedInAt: new Date(),
          helpStartedAt: new Date(),
        },
      });

      const publicId = await revertToWaiting(attendance.id);

      assert(publicId !== null, "should return a publicId on success");

      const updated = await prisma.officeHourAttendance.findUnique({
        where: { id: attendance.id },
      });
      assertEqual(
        updated?.status,
        "WAITING",
        "status should be WAITING after revert",
      );
      assertEqual(
        updated?.helpStartedAt,
        null,
        "helpStartedAt should be cleared",
      );
      assertEqual(
        updated?.helpedByHostId,
        null,
        "helpedByHostId should be cleared",
      );
    },
  );

  // ── Test 2: Already WAITING → atomic guard, returns null ─────────────────
  await runTest("Student already WAITING → returns null", async () => {
    await cleanupAll();
    const { offering } = await setupOffering();
    const session = await setupSession(offering.id);
    const student = await setupStudent("rev2", offering.id);
    const attendance = await prisma.officeHourAttendance.create({
      data: {
        sessionId: session.id,
        studentId: student.id,
        status: "WAITING",
        checkedInAt: new Date(),
      },
    });

    const publicId = await revertToWaiting(attendance.id);

    assertEqual(
      publicId,
      null,
      "should return null when student is already WAITING",
    );

    // Status should be unchanged
    const unchanged = await prisma.officeHourAttendance.findUnique({
      where: { id: attendance.id },
    });
    assertEqual(unchanged?.status, "WAITING", "status should still be WAITING");
  });

  // ── Test 3: Resolved student (in AttendanceRecord, no active attendance) ──
  await runTest(
    "Resolved student has no active attendance → revertToWaiting with invalid id returns null",
    async () => {
      await cleanupAll();
      const { offering } = await setupOffering();
      const session = await setupSession(offering.id);
      const student = await setupStudent("rev3", offering.id);

      // Simulate a resolved student: write to record table, no row in attendance table
      await prisma.officeHourAttendanceRecord.create({
        data: {
          sessionId: session.id,
          studentId: student.id,
          checkedInAt: new Date(),
          outcome: "COMPLETED",
        },
      });

      // Calling revertToWaiting with a non-existent attendanceId returns null
      const publicId = await revertToWaiting(-1);

      assertEqual(
        publicId,
        null,
        "should return null for a non-existent attendance id",
      );
    },
  );

  // ── Test 4: Reverting student A does not affect student B ─────────────────
  await runTest(
    "Reverting student A leaves student B IN_HELP untouched",
    async () => {
      await cleanupAll();
      const { offering } = await setupOffering();
      const session = await setupSession(offering.id);
      const studentA = await setupStudent("iso_a", offering.id);
      const studentB = await setupStudent("iso_b", offering.id);

      const attendanceA = await prisma.officeHourAttendance.create({
        data: {
          sessionId: session.id,
          studentId: studentA.id,
          status: "IN_HELP",
          checkedInAt: new Date(),
          helpStartedAt: new Date(),
        },
      });
      const attendanceB = await prisma.officeHourAttendance.create({
        data: {
          sessionId: session.id,
          studentId: studentB.id,
          status: "IN_HELP",
          checkedInAt: new Date(),
          helpStartedAt: new Date(),
        },
      });

      await revertToWaiting(attendanceA.id);

      const b = await prisma.officeHourAttendance.findUnique({
        where: { id: attendanceB.id },
      });
      assertEqual(b?.status, "IN_HELP", "student B should still be IN_HELP");
    },
  );

  // ── Test 5: Queue position preserved after revert ─────────────────────────
  await runTest(
    "After revert, student returns to correct rank based on original checkedInAt",
    async () => {
      await cleanupAll();
      const { offering } = await setupOffering();
      const session = await setupSession(offering.id);

      const now = Date.now();
      const studentA = await setupStudent("pos_a", offering.id); // checked in first
      const studentB = await setupStudent("pos_b", offering.id); // checked in second (will be reverted)
      const studentC = await setupStudent("pos_c", offering.id); // checked in third

      // Check all in as WAITING with different times
      await prisma.officeHourAttendance.create({
        data: {
          sessionId: session.id,
          studentId: studentA.id,
          status: "WAITING",
          checkedInAt: new Date(now),
        },
      });
      const attendanceB = await prisma.officeHourAttendance.create({
        data: {
          sessionId: session.id,
          studentId: studentB.id,
          status: "WAITING",
          checkedInAt: new Date(now + 1000),
        },
      });
      await prisma.officeHourAttendance.create({
        data: {
          sessionId: session.id,
          studentId: studentC.id,
          status: "WAITING",
          checkedInAt: new Date(now + 2000),
        },
      });

      // Move student B to IN_HELP, then revert
      await prisma.officeHourAttendance.update({
        where: { id: attendanceB.id },
        data: { status: "IN_HELP", helpStartedAt: new Date() },
      });
      await revertToWaiting(attendanceB.id);

      // Now all 3 should be WAITING; B should be rank 2
      const queue = await getActiveQueue(
        session.id,
        session.status,
        session.endsAt,
      );

      assertEqual(queue.waiting.length, 3, "all 3 students should be WAITING");
      assert(
        queue.waiting[1].studentName.includes("pos_b"),
        "student B should be rank 2 (original checkedInAt preserved)",
      );
      assertEqual(queue.waiting[1].rank, 2, "student B rank should be 2");
    },
  );

  await cleanupAll();
  await finishTests();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
