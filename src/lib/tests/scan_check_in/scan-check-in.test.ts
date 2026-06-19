/**
 * Tests: scanCheckIn() query
 *
 * How to run:
 *   pnpm dlx tsx src/lib/tests/scan_check_in/scan-check-in.test.ts
 *
 * Scenarios covered:
 *   Happy path:
 *     1.  Look up by student_number → checked_in, studentName matches
 *     2.  Look up by utorid → checked_in, studentName matches
 *     3.  Look up by barcode (mock map hit) → mock_user outcome
 *     4.  studentName falls back to publicId when firstName/lastName absent
 *   Failure cases:
 *     5.  student_number not in DB → student_not_found
 *     6.  utorid not in DB → student_not_found
 *     7.  barcode not in mock map → student_not_found
 *     8.  Student exists but not enrolled in offering → not_enrolled
 *     9.  Student enrolled as TA (not STUDENT role) → not_enrolled
 *     10. Student already in queue → already_in_queue (P2002 handled)
 *   Re-join:
 *     11. Student checked in, then resolved to AttendanceRecord, then checks
 *         in again → checked_in (new active attendance created)
 *   Isolation:
 *     12. Student enrolled in offering A checks into session for offering B → not_enrolled
 *     13. Two students check in independently; each lands in their own row
 *     14. Same student in two different sessions → two separate rows (no conflict)
 */

import "dotenv/config";

import { prisma } from "@/lib/prisma";
import { scanCheckIn } from "@/lib/queries/scan_check_in/scan-check-in";
import {
  TEST_PREFIX,
  TEST_TERM,
  cleanupAll,
  assert,
  assertEqual,
  runTest,
  finishTests,
} from "../_seed";

// ── Setup helpers ──────────────────────────────────────────────────────────────

async function makeOffering(suffix: string) {
  const course = await prisma.course.create({
    data: { code: `${TEST_PREFIX}SCAN${suffix}` },
  });
  return prisma.courseOffering.create({
    data: { courseId: course.id, termCode: TEST_TERM },
  });
}

async function makeSession(
  offeringId: number,
  status: "ACTIVE" | "SCHEDULED" = "ACTIVE",
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
      type: "DEBUGGING",
      startsAt: start,
      endsAt: end,
      status,
    },
  });
}

async function makeStudent(
  suffix: string,
  offeringId: number | null,
  role: "STUDENT" | "TA" = "STUDENT",
) {
  const student = await prisma.user.create({
    data: {
      utorid: `${TEST_PREFIX}sc_${suffix}`,
      email: `${TEST_PREFIX}sc_${suffix}@mail.utoronto.ca`,
      firstName: "Scan",
      lastName: suffix,
      studentNumber: `9${suffix.padEnd(9, "0").slice(0, 9)}`, // deterministic 10-digit
    },
  });
  if (offeringId !== null) {
    await prisma.offeringMember.create({
      data: { userId: student.id, offeringId, role },
    });
  }
  return student;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== scan-check-in.test.ts ===\n");

  await cleanupAll();

  // ── 1. Look up by student_number → checked_in ────────────────────────────
  await runTest(
    "student_number lookup → checked_in, studentName returned",
    async () => {
      await cleanupAll();
      const offering = await makeOffering("101");
      const session = await makeSession(offering.id);
      const student = await makeStudent("snumA", offering.id);

      const result = await scanCheckIn(
        session.id,
        offering.id,
        "student_number",
        student.studentNumber!,
      );

      assertEqual(result.outcome, "checked_in", "outcome");
      assert("studentName" in result, "studentName present");
      assert(
        (result as { studentName: string }).studentName.includes("snumA"),
        "studentName contains last name",
      );

      // Row exists in DB with correct status
      const row = await prisma.officeHourAttendance.findFirst({
        where: { sessionId: session.id, studentId: student.id },
      });
      assert(row !== null, "attendance row created");
      assertEqual(row!.status, "WAITING", "status is WAITING");
    },
  );

  // ── 2. Look up by utorid → checked_in ────────────────────────────────────
  await runTest("utorid lookup → checked_in", async () => {
    await cleanupAll();
    const offering = await makeOffering("102");
    const session = await makeSession(offering.id);
    const student = await makeStudent("utor1", offering.id);

    const result = await scanCheckIn(
      session.id,
      offering.id,
      "utorid",
      student.utorid,
    );

    assertEqual(result.outcome, "checked_in", "outcome");
    const row = await prisma.officeHourAttendance.findFirst({
      where: { sessionId: session.id, studentId: student.id },
    });
    assert(row !== null, "attendance row created");
  });

  // ── 3. Barcode in mock map → mock_user ───────────────────────────────────
  await runTest(
    "barcode in mock map → mock_user, studentName from map",
    async () => {
      await cleanupAll();
      const offering = await makeOffering("103");
      const session = await makeSession(offering.id);

      // No DB student needed — mock map is keyed by barcode string
      const result = await scanCheckIn(
        session.id,
        offering.id,
        "barcode",
        "1234567890123456",
      );

      assertEqual(result.outcome, "mock_user", "outcome");
      assert("studentName" in result, "studentName present");
      assertEqual(
        (result as { studentName: string }).studentName,
        "Mock Student",
        "studentName from mock map",
      );
    },
  );

  // ── 4. studentName falls back to publicId when name fields are empty ──────
  await runTest(
    "student with no firstName/lastName → publicId used as studentName",
    async () => {
      await cleanupAll();
      const offering = await makeOffering("104");
      const session = await makeSession(offering.id);

      // Create user with NULL names
      const student = await prisma.user.create({
        data: {
          utorid: `${TEST_PREFIX}sc_noname`,
          email: `${TEST_PREFIX}sc_noname@mail.utoronto.ca`,
          // firstName / lastName deliberately omitted → will be null in DB
        },
      });
      await prisma.offeringMember.create({
        data: { userId: student.id, offeringId: offering.id, role: "STUDENT" },
      });

      const result = await scanCheckIn(
        session.id,
        offering.id,
        "utorid",
        student.utorid,
      );

      assertEqual(result.outcome, "checked_in", "outcome");
      assertEqual(
        (result as { studentName: string }).studentName,
        student.publicId,
        "studentName falls back to publicId",
      );
    },
  );

  // ── 5. student_number not in DB → student_not_found ──────────────────────
  await runTest("unknown student_number → student_not_found", async () => {
    await cleanupAll();
    const offering = await makeOffering("105");
    const session = await makeSession(offering.id);

    const result = await scanCheckIn(
      session.id,
      offering.id,
      "student_number",
      "0000000000",
    );

    assertEqual(result.outcome, "student_not_found", "outcome");
  });

  // ── 6. utorid not in DB → student_not_found ──────────────────────────────
  await runTest("unknown utorid → student_not_found", async () => {
    await cleanupAll();
    const offering = await makeOffering("106");
    const session = await makeSession(offering.id);

    const result = await scanCheckIn(
      session.id,
      offering.id,
      "utorid",
      "zzz00000",
    );

    assertEqual(result.outcome, "student_not_found", "outcome");
  });

  // ── 7. Barcode not in mock map → student_not_found ───────────────────────
  await runTest("barcode not in mock map → student_not_found", async () => {
    await cleanupAll();
    const offering = await makeOffering("107");
    const session = await makeSession(offering.id);

    const result = await scanCheckIn(
      session.id,
      offering.id,
      "barcode",
      "0000000000000000",
    );

    assertEqual(result.outcome, "student_not_found", "outcome");
  });

  // ── 8. Student exists but not enrolled in this offering → not_enrolled ────
  await runTest("student exists but not enrolled → not_enrolled", async () => {
    await cleanupAll();
    const offering = await makeOffering("108");
    const session = await makeSession(offering.id);
    // Pass null so the student has NO offering membership at all
    const student = await makeStudent("unenrl", null);

    const result = await scanCheckIn(
      session.id,
      offering.id,
      "utorid",
      student.utorid,
    );

    assertEqual(result.outcome, "not_enrolled", "outcome");
  });

  // ── 9. Student enrolled as TA → not_enrolled ─────────────────────────────
  await runTest(
    "student enrolled as TA (not STUDENT role) → not_enrolled",
    async () => {
      await cleanupAll();
      const offering = await makeOffering("109");
      const session = await makeSession(offering.id);
      const ta = await makeStudent("tainq", offering.id, "TA");

      const result = await scanCheckIn(
        session.id,
        offering.id,
        "utorid",
        ta.utorid,
      );

      assertEqual(result.outcome, "not_enrolled", "outcome");
    },
  );

  // ── 10. Student already in queue → already_in_queue ──────────────────────
  await runTest(
    "student already in queue → already_in_queue (no duplicate row)",
    async () => {
      await cleanupAll();
      const offering = await makeOffering("110");
      const session = await makeSession(offering.id);
      const student = await makeStudent("dup1", offering.id);

      // First scan — should succeed
      const first = await scanCheckIn(
        session.id,
        offering.id,
        "utorid",
        student.utorid,
      );
      assertEqual(first.outcome, "checked_in", "first scan outcome");

      // Second scan — should detect duplicate
      const second = await scanCheckIn(
        session.id,
        offering.id,
        "utorid",
        student.utorid,
      );
      assertEqual(second.outcome, "already_in_queue", "second scan outcome");

      // Only one row in DB
      const rows = await prisma.officeHourAttendance.findMany({
        where: { sessionId: session.id, studentId: student.id },
      });
      assertEqual(rows.length, 1, "exactly one attendance row");
    },
  );

  // ── 11. Re-join after resolution → checked_in again ─────────────────────
  await runTest(
    "student resolved (in record table) then re-scans → checked_in",
    async () => {
      await cleanupAll();
      const offering = await makeOffering("111");
      const session = await makeSession(offering.id);
      const student = await makeStudent("rejoin", offering.id);

      // Simulate the student having been helped: move them to the record table
      await prisma.officeHourAttendanceRecord.create({
        data: {
          sessionId: session.id,
          studentId: student.id,
          checkedInAt: new Date(Date.now() - 60_000),
          outcome: "COMPLETED",
        },
      });
      // No active attendance row exists

      // Student re-scans
      const result = await scanCheckIn(
        session.id,
        offering.id,
        "utorid",
        student.utorid,
      );

      assertEqual(result.outcome, "checked_in", "outcome after re-join");

      // New active attendance row created
      const row = await prisma.officeHourAttendance.findFirst({
        where: { sessionId: session.id, studentId: student.id },
      });
      assert(row !== null, "new attendance row created");
      assertEqual(row!.status, "WAITING", "status is WAITING");
    },
  );

  // ── 12. Student enrolled in offering A, scanned for offering B → not_enrolled
  await runTest(
    "student enrolled in offering A scanned for offering B → not_enrolled",
    async () => {
      await cleanupAll();
      const offeringA = await makeOffering("112a");
      const offeringB = await makeOffering("112b");
      const sessionB = await makeSession(offeringB.id);
      // Student is a member of A only
      const student = await makeStudent("wrongof", offeringA.id);

      const result = await scanCheckIn(
        sessionB.id,
        offeringB.id,
        "utorid",
        student.utorid,
      );

      assertEqual(result.outcome, "not_enrolled", "outcome");
    },
  );

  // ── 13. Two students check in independently ───────────────────────────────
  await runTest(
    "two students check in independently — each gets their own row",
    async () => {
      await cleanupAll();
      const offering = await makeOffering("113");
      const session = await makeSession(offering.id);
      const studentA = await makeStudent("indA", offering.id);
      const studentB = await makeStudent("indB", offering.id);

      const resultA = await scanCheckIn(
        session.id,
        offering.id,
        "utorid",
        studentA.utorid,
      );
      const resultB = await scanCheckIn(
        session.id,
        offering.id,
        "utorid",
        studentB.utorid,
      );

      assertEqual(resultA.outcome, "checked_in", "student A outcome");
      assertEqual(resultB.outcome, "checked_in", "student B outcome");

      const rows = await prisma.officeHourAttendance.findMany({
        where: { sessionId: session.id },
      });
      assertEqual(rows.length, 2, "two separate attendance rows");
    },
  );

  // ── 14. Same student in two different sessions → two rows, no conflict ────
  await runTest(
    "same student checks into two different sessions — no unique conflict",
    async () => {
      await cleanupAll();
      const offering = await makeOffering("114");
      const session1 = await makeSession(offering.id);
      const session2 = await makeSession(offering.id);
      const student = await makeStudent("twoses", offering.id);

      const r1 = await scanCheckIn(
        session1.id,
        offering.id,
        "utorid",
        student.utorid,
      );
      const r2 = await scanCheckIn(
        session2.id,
        offering.id,
        "utorid",
        student.utorid,
      );

      assertEqual(r1.outcome, "checked_in", "session 1 outcome");
      assertEqual(r2.outcome, "checked_in", "session 2 outcome");

      const total = await prisma.officeHourAttendance.findMany({
        where: { studentId: student.id },
      });
      assertEqual(total.length, 2, "two separate rows for two sessions");
    },
  );

  await cleanupAll();
  await finishTests();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
