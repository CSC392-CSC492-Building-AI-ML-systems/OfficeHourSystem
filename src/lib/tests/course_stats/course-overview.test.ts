/**
 * Tests: getCourseOverview() + getCourseStudentDetails() queries
 *
 * How to run:
 *   npx tsx src/lib/tests/course_stats/course-overview.test.ts
 *
 * Scenarios:
 *   1. Overview totals + per-session averages across multiple sessions
 *   2. Empty offering → zeros and null ratios
 *   3. Student details aggregate the same student across sessions
 *   4. Student details sort by visitCount → helpedCount → totalHelpMinutes
 */

import "dotenv/config";

import { prisma } from "@/lib/prisma";
import {
  getCourseOverview,
  getCourseStudentDetails,
} from "@/lib/queries/course_stats/course-overview";
import {
  TEST_PREFIX,
  TEST_TERM,
  cleanupAll,
  assert,
  assertEqual,
  runTest,
  finishTests,
} from "../_seed";

function approx(actual: number | null, expected: number, label: string) {
  assert(
    actual !== null && Math.abs(actual - expected) < 0.01,
    `${label} → expected ~${expected}, got ${actual}`,
  );
}

async function makeOffering(suffix: string) {
  const course = await prisma.course.create({
    data: { code: `${TEST_PREFIX}CO${suffix}` },
  });
  const offering = await prisma.courseOffering.create({
    data: { courseId: course.id, termCode: TEST_TERM },
  });
  return {
    id: offering.id,
    publicId: offering.publicId,
    termCode: offering.termCode,
    courseCode: course.code,
  };
}

async function makeSession(
  offeringId: number,
  title: string,
  status: "COMPLETED" | "ACTIVE" | "SCHEDULED" = "COMPLETED",
) {
  const start = new Date();
  start.setHours(10, 0, 0, 0);
  return prisma.officeHourSession.create({
    data: {
      offeringId,
      title,
      type: "DEBUGGING",
      startsAt: start,
      endsAt: new Date(start.getTime() + 60 * 60_000),
      status,
    },
  });
}

async function makeStudent(suffix: string, offeringId: number) {
  const user = await prisma.user.create({
    data: {
      utorid: `${TEST_PREFIX}co_${suffix}`,
      firstName: "Co",
      lastName: suffix,
      email: `${TEST_PREFIX}co_${suffix}@mail.utoronto.ca`,
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
      utorid: `${TEST_PREFIX}coh_${suffix}`,
      firstName: "Host",
      lastName: suffix,
      email: `${TEST_PREFIX}coh_${suffix}@mail.utoronto.ca`,
    },
  });
  return prisma.officeHourSessionHost.create({
    data: { sessionId, userId: user.id, role: "TA" },
  });
}

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
  console.log("=== course-overview.test.ts ===\n");
  await cleanupAll();

  // 1. Overview totals + per-session averages
  await runTest("overview totals and per-session averages", async () => {
    await cleanupAll();
    const offering = await makeOffering("1");
    const s1 = await makeSession(offering.id, "Mon");
    const s2 = await makeSession(offering.id, "Wed");
    const h1 = await makeHost(s1.id, "h1");
    const h2 = await makeHost(s2.id, "h2");

    const A = await makeStudent("a", offering.id);
    const B = await makeStudent("b", offering.id);
    const C = await makeStudent("c", offering.id);
    const D = await makeStudent("d", offering.id);

    // S1: A helped(10), B helped(20); S2: A helped(20), C no-show
    await addRecord(s1.id, A.id, { waitMin: 5, helpMin: 10, hostId: h1.id });
    await addRecord(s1.id, B.id, { waitMin: 8, helpMin: 20, hostId: h1.id });
    await addRecord(s2.id, A.id, { waitMin: 3, helpMin: 20, hostId: h2.id });
    await addRecord(s2.id, C.id, { waitMin: null, helpMin: null });

    // interests: S1 → A,B,D ; S2 → A
    await prisma.officeHourInterest.createMany({
      data: [
        { sessionId: s1.id, userId: A.id },
        { sessionId: s1.id, userId: B.id },
        { sessionId: s1.id, userId: D.id },
        { sessionId: s2.id, userId: A.id },
      ],
    });

    const o = await getCourseOverview(offering);

    assertEqual(o.totalStudents, 4, "totalStudents");
    assertEqual(o.endedSessionCount, 2, "endedSessionCount");
    assertEqual(o.studentsHelped, 2, "studentsHelped (A,B)");
    approx(o.helpedRatio, 0.5, "helpedRatio");
    assertEqual(o.studentsCheckedIn, 3, "studentsCheckedIn (A,B,C)");
    assertEqual(o.interestRecords, 4, "interestRecords");
    assertEqual(o.studentsInterested, 3, "studentsInterested (A,B,D)");
    approx(o.interestedRatio, 0.75, "interestedRatio");
    approx(o.interestedShowedRatio, 2 / 3, "interestedShowedRatio");
    approx(o.avgHelpMinutes, (10 + 20 + 20) / 3, "avgHelpMinutes");
    approx(o.avgHelpedPerSession, 1.5, "avgHelpedPerSession");
    approx(o.avgInterestedPerSession, 2, "avgInterestedPerSession");
    approx(o.avgCheckInsPerSession, 2, "avgCheckInsPerSession");
  });

  // 2. Only an upcoming session → no ended sessions, per-session all null
  await runTest(
    "upcoming session only → sessionCount 0, per-session null",
    async () => {
      await cleanupAll();
      const offering = await makeOffering("2");
      await makeSession(offering.id, "Upcoming", "SCHEDULED");

      const o = await getCourseOverview(offering);
      assertEqual(o.totalStudents, 0, "totalStudents");
      assertEqual(o.endedSessionCount, 0, "no ended sessions");
      assertEqual(o.studentsHelped, 0, "studentsHelped");
      assertEqual(o.helpedRatio, null, "helpedRatio null (no students)");
      assertEqual(o.studentsCheckedIn, 0, "studentsCheckedIn");
      assertEqual(o.interestRecords, 0, "interestRecords");
      assertEqual(o.interestedShowedRatio, null, "ratio null");
      assertEqual(o.avgHelpMinutes, null, "avgHelpMinutes null");
      assertEqual(o.avgHelpedPerSession, null, "avgHelpedPerSession null");
      assertEqual(o.avgCheckInsPerSession, null, "avgCheckInsPerSession null");
    },
  );

  // 3. Student details aggregate across sessions
  await runTest(
    "student details aggregate the same student across sessions",
    async () => {
      await cleanupAll();
      const offering = await makeOffering("3");
      const s1 = await makeSession(offering.id, "Mon");
      const s2 = await makeSession(offering.id, "Wed");
      const h1 = await makeHost(s1.id, "alex");
      const h2 = await makeHost(s2.id, "max");
      const A = await makeStudent("a", offering.id);

      await addRecord(s1.id, A.id, { waitMin: 5, helpMin: 15, hostId: h1.id });
      await addRecord(s2.id, A.id, { waitMin: 3, helpMin: 10, hostId: h2.id });

      const details = await getCourseStudentDetails(offering.id);
      assertEqual(details.length, 1, "one student");
      const a = details[0];
      assertEqual(a.visitCount, 2, "visitCount");
      assertEqual(a.helpedCount, 2, "helpedCount");
      assertEqual(a.totalHelpMinutes, 25, "totalHelpMinutes");
      assertEqual(a.totalWaitMinutes, 8, "totalWaitMinutes");
      assertEqual(a.visits.length, 2, "two visits");
      assert(
        a.visits.some((v) => v.sessionTitle === "Mon") &&
          a.visits.some((v) => v.sessionTitle === "Wed"),
        "visits carry session titles",
      );
    },
  );

  // 4. Sorting: visitCount → helpedCount → totalHelpMinutes
  await runTest(
    "student details sorted by visit count then helped count",
    async () => {
      await cleanupAll();
      const offering = await makeOffering("4");
      const s1 = await makeSession(offering.id, "Mon");
      const host = await makeHost(s1.id, "h");
      const many = await makeStudent("many", offering.id);
      const few = await makeStudent("few", offering.id);

      // many: 2 visits; few: 1 visit → many first
      await addRecord(s1.id, many.id, {
        waitMin: 1,
        helpMin: 5,
        hostId: host.id,
      });
      await addRecord(s1.id, many.id, {
        waitMin: 1,
        helpMin: 5,
        hostId: host.id,
      });
      await addRecord(s1.id, few.id, {
        waitMin: 1,
        helpMin: 30,
        hostId: host.id,
      });

      const details = await getCourseStudentDetails(offering.id);
      assertEqual(details[0].visitCount, 2, "most visits first");
      assertEqual(details[1].visitCount, 1, "fewer visits last");
    },
  );

  // 5. ACTIVE session counts toward totals but NOT per-session averages
  await runTest(
    "active session excluded from per-session averages",
    async () => {
      await cleanupAll();
      const offering = await makeOffering("5");
      const done = await makeSession(offering.id, "Done", "COMPLETED");
      const live = await makeSession(offering.id, "Live", "ACTIVE");
      const hDone = await makeHost(done.id, "hd");
      const hLive = await makeHost(live.id, "hl");
      const A = await makeStudent("a", offering.id);
      const B = await makeStudent("b", offering.id);

      await addRecord(done.id, A.id, {
        waitMin: 2,
        helpMin: 10,
        hostId: hDone.id,
      });
      await addRecord(live.id, B.id, {
        waitMin: 1,
        helpMin: 20,
        hostId: hLive.id,
      });

      const o = await getCourseOverview(offering);
      // ENDED-only: the active session's record is excluded everywhere
      assertEqual(o.studentsHelped, 1, "only ended helped (A, not B)");
      assertEqual(o.studentsCheckedIn, 1, "only ended checked in");
      approx(o.avgHelpMinutes, 10, "avg help from ended session only");
      assertEqual(o.endedSessionCount, 1, "only the ended session counted");
      approx(o.avgHelpedPerSession, 1, "1 helped in the single ended session");
      approx(o.avgCheckInsPerSession, 1, "1 check-in in the ended session");
    },
  );

  // 6. Interest on a non-ended session: counts in totals, excluded from
  //    ended-only metrics (showed ratio + per-session interest average).
  await runTest(
    "interest on non-ended session: totals only, not ended metrics",
    async () => {
      await cleanupAll();
      const offering = await makeOffering("6");
      const ended = await makeSession(offering.id, "Done", "COMPLETED");
      const upcoming = await makeSession(offering.id, "Soon", "SCHEDULED");
      const A = await makeStudent("a", offering.id);
      const B = await makeStudent("b", offering.id);
      const h = await makeHost(ended.id, "h");

      await addRecord(ended.id, A.id, {
        waitMin: 2,
        helpMin: 10,
        hostId: h.id,
      });
      await prisma.officeHourInterest.createMany({
        data: [
          { sessionId: ended.id, userId: A.id }, // ended, came
          { sessionId: upcoming.id, userId: B.id }, // non-ended
        ],
      });

      const o = await getCourseOverview(offering);
      // Totals span the whole offering
      assertEqual(
        o.interestRecords,
        2,
        "interestRecords includes the upcoming one",
      );
      assertEqual(o.studentsInterested, 2, "studentsInterested includes B");
      // Ended-only metrics ignore the upcoming session's interest
      assertEqual(o.endedSessionCount, 1, "one ended session");
      approx(
        o.interestedShowedRatio,
        1,
        "showed ratio over ended interest only (A came)",
      );
      approx(
        o.avgInterestedPerSession,
        1,
        "per-session interest counts ended only (B excluded)",
      );
    },
  );

  // 7. A student attending two ended sessions is counted once in totals.
  await runTest(
    "studentsCheckedIn / studentsHelped dedupe across ended sessions",
    async () => {
      await cleanupAll();
      const offering = await makeOffering("7");
      const s1 = await makeSession(offering.id, "S1", "COMPLETED");
      const s2 = await makeSession(offering.id, "S2", "COMPLETED");
      const A = await makeStudent("a", offering.id);
      const h1 = await makeHost(s1.id, "h1");
      const h2 = await makeHost(s2.id, "h2");

      await addRecord(s1.id, A.id, { waitMin: 1, helpMin: 5, hostId: h1.id });
      await addRecord(s2.id, A.id, { waitMin: 1, helpMin: 5, hostId: h2.id });

      const o = await getCourseOverview(offering);
      assertEqual(o.studentsCheckedIn, 1, "A counted once across two sessions");
      assertEqual(o.studentsHelped, 1, "A helped counted once");
      approx(
        o.avgCheckInsPerSession,
        1,
        "1 distinct check-in per session on average",
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
