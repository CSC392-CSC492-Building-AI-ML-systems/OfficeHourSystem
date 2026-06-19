/**
 * Tests: endSession()
 *
 * How to run:
 *   pnpm dlx tsx src/lib/tests/end_session/end-session.test.ts
 *
 * Scenarios covered:
 *   1. ACTIVE session, no students → session becomes COMPLETED, returns "ended"
 *   2. WAITING students → all moved to AttendanceRecord with outcome CANCELLED, attendance deleted
 *   3. IN_HELP students → all moved to AttendanceRecord with outcome COMPLETED (helpEndedAt null), attendance deleted
 *   4. Mix of WAITING and IN_HELP → both resolved correctly in one transaction
 *   5. Already COMPLETED session → returns "already_ended", nothing changes
 *   6. After endSession, students can re-join (attendance table is cleared)
 */

import "dotenv/config";

import { prisma } from "@/lib/prisma";
import { endSession } from "@/lib/queries/end_session/end-session";
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
    data: { code: `${TEST_PREFIX}ENDSESS101` },
  });
  const offering = await prisma.courseOffering.create({
    data: { courseId: course.id, termCode: TEST_TERM },
  });
  return { offering };
}

async function createSession(
  offeringId: number,
  status: "ACTIVE" | "COMPLETED" = "ACTIVE",
) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(10, 0, 0, 0);
  const end = new Date(now);
  end.setHours(11, 0, 0, 0);
  return prisma.officeHourSession.create({
    data: {
      offeringId,
      title: "Test Session",
      type: "REGULAR",
      startsAt: start,
      endsAt: end,
      status,
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
  console.log("=== end-session.test.ts ===\n");

  await cleanupAll();

  // ── Test 1: No students, session becomes COMPLETED ────────────────────────
  await runTest(
    "ACTIVE session with no students → COMPLETED, returns 'ended'",
    async () => {
      await cleanupAll();
      const { offering } = await setupOffering();
      const session = await createSession(offering.id);

      const result = await endSession(session.id);

      assertEqual(result, "ended", "should return 'ended'");

      const updated = await prisma.officeHourSession.findUnique({
        where: { id: session.id },
      });
      assertEqual(
        updated?.status,
        "COMPLETED",
        "session status should be COMPLETED",
      );
    },
  );

  // ── Test 2: WAITING students → CANCELLED records, attendance deleted ──────
  await runTest(
    "WAITING students → CANCELLED records created, attendance rows deleted",
    async () => {
      await cleanupAll();
      const { offering } = await setupOffering();
      const session = await createSession(offering.id);

      const s1 = await setupStudent("w1", offering.id);
      const s2 = await setupStudent("w2", offering.id);

      await prisma.officeHourAttendance.createMany({
        data: [
          {
            sessionId: session.id,
            studentId: s1.id,
            status: "WAITING",
            checkedInAt: new Date(),
          },
          {
            sessionId: session.id,
            studentId: s2.id,
            status: "WAITING",
            checkedInAt: new Date(),
          },
        ],
      });

      await endSession(session.id);

      // Attendance table should be empty for this session
      const remaining = await prisma.officeHourAttendance.count({
        where: { sessionId: session.id },
      });
      assertEqual(remaining, 0, "attendance table should be empty");

      // Two CANCELLED records should exist
      const records = await prisma.officeHourAttendanceRecord.findMany({
        where: { sessionId: session.id },
      });
      assertEqual(records.length, 2, "should have 2 records");
      assert(
        records.every((r) => r.outcome === "CANCELLED"),
        "all records should be CANCELLED",
      );
      assert(
        records.every((r) => r.helpEndedAt === null),
        "helpEndedAt should be null for cancelled",
      );
    },
  );

  // ── Test 3: IN_HELP students → COMPLETED records, helpEndedAt null ────────
  await runTest(
    "IN_HELP students → COMPLETED records, helpEndedAt null, attendance deleted",
    async () => {
      await cleanupAll();
      const { offering } = await setupOffering();
      const session = await createSession(offering.id);

      const s1 = await setupStudent("h1", offering.id);
      const s2 = await setupStudent("h2", offering.id);

      await prisma.officeHourAttendance.createMany({
        data: [
          {
            sessionId: session.id,
            studentId: s1.id,
            status: "IN_HELP",
            checkedInAt: new Date(),
            helpStartedAt: new Date(),
          },
          {
            sessionId: session.id,
            studentId: s2.id,
            status: "IN_HELP",
            checkedInAt: new Date(),
            helpStartedAt: new Date(),
          },
        ],
      });

      await endSession(session.id);

      const remaining = await prisma.officeHourAttendance.count({
        where: { sessionId: session.id },
      });
      assertEqual(remaining, 0, "attendance table should be empty");

      const records = await prisma.officeHourAttendanceRecord.findMany({
        where: { sessionId: session.id },
      });
      assertEqual(records.length, 2, "should have 2 records");
      assert(
        records.every((r) => r.outcome === "COMPLETED"),
        "all records should be COMPLETED",
      );
      assert(
        records.every((r) => r.helpEndedAt === null),
        "helpEndedAt null — force-ended, not normal END HELP",
      );
    },
  );

  // ── Test 4: Mix of WAITING and IN_HELP → both resolved correctly ──────────
  await runTest(
    "Mix of WAITING and IN_HELP → correct outcomes for each",
    async () => {
      await cleanupAll();
      const { offering } = await setupOffering();
      const session = await createSession(offering.id);

      const w1 = await setupStudent("mix_w1", offering.id);
      const w2 = await setupStudent("mix_w2", offering.id);
      const h1 = await setupStudent("mix_h1", offering.id);

      await prisma.officeHourAttendance.createMany({
        data: [
          {
            sessionId: session.id,
            studentId: w1.id,
            status: "WAITING",
            checkedInAt: new Date(),
          },
          {
            sessionId: session.id,
            studentId: w2.id,
            status: "WAITING",
            checkedInAt: new Date(),
          },
          {
            sessionId: session.id,
            studentId: h1.id,
            status: "IN_HELP",
            checkedInAt: new Date(),
            helpStartedAt: new Date(),
          },
        ],
      });

      await endSession(session.id);

      const records = await prisma.officeHourAttendanceRecord.findMany({
        where: { sessionId: session.id },
      });
      assertEqual(records.length, 3, "should have 3 records total");

      const cancelled = records.filter((r) => r.outcome === "CANCELLED");
      const completed = records.filter((r) => r.outcome === "COMPLETED");
      assertEqual(
        cancelled.length,
        2,
        "2 CANCELLED records for WAITING students",
      );
      assertEqual(
        completed.length,
        1,
        "1 COMPLETED record for IN_HELP student",
      );
    },
  );

  // ── Test 5: Already COMPLETED → returns "already_ended" ──────────────────
  await runTest(
    "Already COMPLETED session → returns 'already_ended'",
    async () => {
      await cleanupAll();
      const { offering } = await setupOffering();
      const session = await createSession(offering.id, "COMPLETED");

      const result = await endSession(session.id);

      assertEqual(result, "already_ended", "should return 'already_ended'");
    },
  );

  // ── Test 6: After endSession, students can re-check in ────────────────────
  await runTest(
    "After endSession, student can check in again (attendance table cleared)",
    async () => {
      await cleanupAll();
      const { offering } = await setupOffering();
      const session = await createSession(offering.id);
      const student = await setupStudent("rejoin1", offering.id);

      await prisma.officeHourAttendance.create({
        data: {
          sessionId: session.id,
          studentId: student.id,
          status: "WAITING",
          checkedInAt: new Date(),
        },
      });

      await endSession(session.id);

      // Attendance row is gone — student can re-check in without unique constraint error
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
        "student should be able to re-check in after session ended",
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
