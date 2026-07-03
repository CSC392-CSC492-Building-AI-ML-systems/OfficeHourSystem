/**
 * Tests: getSessionStatsMeta() + getSessionStatsStudents() queries
 *
 * How to run:
 *   npx tsx src/lib/tests/course_stats/session-detail.test.ts
 *
 * Scenarios:
 *   1. A student with multiple visits is grouped into one row with totals
 *   2. Students sorted by total help time → visit count → total wait time
 *   3. Missing timestamps → helpMinutes/waitMinutes null (NA); no host → helperName null
 *   4. Help/wait minutes computed correctly, helperName resolved
 */

import "dotenv/config";

import { prisma } from "@/lib/prisma";
import {
  getSessionStatsMeta,
  getSessionStatsStudents,
} from "@/lib/queries/course_stats/session-detail";
import {
  TEST_PREFIX,
  TEST_TERM,
  cleanupAll,
  assert,
  assertEqual,
  runTest,
  finishTests,
} from "../_seed";

async function makeSession() {
  const course = await prisma.course.create({
    data: { code: `${TEST_PREFIX}DET` },
  });
  const offering = await prisma.courseOffering.create({
    data: { courseId: course.id, termCode: TEST_TERM },
  });
  const start = new Date();
  start.setHours(10, 0, 0, 0);
  const session = await prisma.officeHourSession.create({
    data: {
      offeringId: offering.id,
      title: "Detail Session",
      type: "DEBUGGING",
      startsAt: start,
      endsAt: new Date(start.getTime() + 2 * 60 * 60_000),
      status: "COMPLETED",
    },
  });
  return { offering, session };
}

async function makeStudent(
  suffix: string,
  offeringId: number,
  studentNumber?: string,
) {
  const user = await prisma.user.create({
    data: {
      utorid: `${TEST_PREFIX}d_${suffix}`,
      firstName: "D",
      lastName: suffix,
      email: `${TEST_PREFIX}d_${suffix}@mail.utoronto.ca`,
      studentNumber: studentNumber ?? null,
    },
  });
  await prisma.offeringMember.create({
    data: { userId: user.id, offeringId, role: "STUDENT" },
  });
  return user;
}

async function makeHost(sessionId: number, suffix: string) {
  const user = await prisma.user.create({
    data: {
      utorid: `${TEST_PREFIX}h_${suffix}`,
      firstName: "Host",
      lastName: suffix,
      email: `${TEST_PREFIX}h_${suffix}@mail.utoronto.ca`,
    },
  });
  return prisma.officeHourSessionHost.create({
    data: { sessionId, userId: user.id, role: "TA" },
  });
}

// helped: minutes waited then minutes helped; if null params → unresolved timestamps
async function addRecord(
  sessionId: number,
  studentId: number,
  opts: { waitMin: number | null; helpMin: number | null; hostId?: number },
) {
  const checkedInAt = new Date();
  const helpStartedAt =
    opts.waitMin === null
      ? null
      : new Date(checkedInAt.getTime() + opts.waitMin * 60_000);
  const helpEndedAt =
    helpStartedAt && opts.helpMin !== null
      ? new Date(helpStartedAt.getTime() + opts.helpMin * 60_000)
      : null;
  return prisma.officeHourAttendanceRecord.create({
    data: {
      sessionId,
      studentId,
      checkedInAt,
      helpStartedAt,
      helpEndedAt,
      helpedByHostId: opts.hostId ?? null,
      outcome: helpEndedAt ? "COMPLETED" : "NO_SHOW",
    },
  });
}

async function main() {
  console.log("=== session-detail.test.ts ===\n");
  await cleanupAll();

  // 1. Multiple visits grouped
  await runTest(
    "student with 2 visits → grouped with summed totals",
    async () => {
      await cleanupAll();
      const { offering, session } = await makeSession();
      const host = await makeHost(session.id, "h1");
      const s = await makeStudent("s1", offering.id, `${TEST_PREFIX}SN1`);

      await addRecord(session.id, s.id, {
        waitMin: 5,
        helpMin: 10,
        hostId: host.id,
      });
      await addRecord(session.id, s.id, {
        waitMin: 3,
        helpMin: 7,
        hostId: host.id,
      });

      const students = await getSessionStatsStudents(session.id);
      assertEqual(students.length, 1, "one grouped student");
      const grp = students[0];
      assertEqual(grp.visitCount, 2, "visit count");
      assertEqual(grp.totalHelpMinutes, 17, "total help");
      assertEqual(grp.totalWaitMinutes, 8, "total wait");
      assertEqual(grp.studentNumber, `${TEST_PREFIX}SN1`, "student number");
    },
  );

  // 2. Sorting by total help time desc
  await runTest("students sorted by total help time desc", async () => {
    await cleanupAll();
    const { offering, session } = await makeSession();
    const host = await makeHost(session.id, "h2");
    const low = await makeStudent("low", offering.id);
    const high = await makeStudent("high", offering.id);

    await addRecord(session.id, low.id, {
      waitMin: 1,
      helpMin: 5,
      hostId: host.id,
    });
    await addRecord(session.id, high.id, {
      waitMin: 1,
      helpMin: 30,
      hostId: host.id,
    });

    const students = await getSessionStatsStudents(session.id);
    assertEqual(students[0].totalHelpMinutes, 30, "highest first");
    assertEqual(students[1].totalHelpMinutes, 5, "lowest last");
  });

  // 3. Missing timestamps → NA; no host → helperName null
  await runTest("no-show record → null help/wait/helper", async () => {
    await cleanupAll();
    const { offering, session } = await makeSession();
    const s = await makeStudent("ns", offering.id);

    await addRecord(session.id, s.id, { waitMin: null, helpMin: null });

    const students = await getSessionStatsStudents(session.id);
    const visit = students[0].visits[0];
    assertEqual(visit.helpMinutes, null, "help NA");
    assertEqual(visit.waitMinutes, null, "wait NA");
    assertEqual(visit.helperName, null, "helper NA");
    assertEqual(students[0].totalHelpMinutes, 0, "null counts as 0");
  });

  // 4. helperName resolved + minutes correct
  await runTest("helper name resolved and minutes correct", async () => {
    await cleanupAll();
    const { offering, session } = await makeSession();
    const host = await makeHost(session.id, "named");
    const s = await makeStudent("s4", offering.id);

    await addRecord(session.id, s.id, {
      waitMin: 4,
      helpMin: 9,
      hostId: host.id,
    });

    const students = await getSessionStatsStudents(session.id);
    const visit = students[0].visits[0];
    assertEqual(visit.helpMinutes, 9, "help minutes");
    assertEqual(visit.waitMinutes, 4, "wait minutes");
    assertEqual(visit.helperName, "Host named", "helper name");
  });

  // 5. Meta carries offeringPublicId (used by the back link) + host names
  await runTest("meta carries offeringPublicId and host names", async () => {
    await cleanupAll();
    const { offering, session } = await makeSession();
    await makeHost(session.id, "alex");

    const meta = await getSessionStatsMeta(session.publicId);
    assert(meta !== null, "meta returned");
    assertEqual(
      meta!.offeringPublicId,
      offering.publicId,
      "offeringPublicId matches",
    );
    assertEqual(meta!.hostNames.length, 1, "one host name");
  });

  await cleanupAll();
  await finishTests();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
