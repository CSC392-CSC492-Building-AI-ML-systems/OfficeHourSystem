/**
 * Tests: getSessionStatsForOffering() query
 *
 * How to run:
 *   npx tsx src/lib/tests/course_stats/course-stats.test.ts
 *
 * Scenarios:
 *   1. Scoped to the given offering only (other offerings excluded)
 *   2. COMPLETED debugging session → all four metrics computed
 *   3. SCHEDULED session → attendance metrics are null (NA), interested is a number
 *   4. Only DEBUGGING sessions are returned (REGULAR excluded)
 */

import "dotenv/config";

import { prisma } from "@/lib/prisma";
import { getSessionStatsForOffering } from "@/lib/queries/course_stats/course-stats";
import {
  TEST_PREFIX,
  TEST_TERM,
  cleanupAll,
  assert,
  assertEqual,
  runTest,
  finishTests,
} from "../_seed";

async function makeOffering(suffix: string) {
  const course = await prisma.course.create({
    data: { code: `${TEST_PREFIX}CS${suffix}` },
  });
  return prisma.courseOffering.create({
    data: { courseId: course.id, termCode: TEST_TERM },
  });
}

async function makeUser(
  suffix: string,
  offeringId: number,
  role: "INSTRUCTOR" | "TA" | "STUDENT",
) {
  const user = await prisma.user.create({
    data: {
      utorid: `${TEST_PREFIX}u_${suffix}`,
      firstName: "U",
      lastName: suffix,
      email: `${TEST_PREFIX}u_${suffix}@mail.utoronto.ca`,
    },
  });
  await prisma.offeringMember.create({
    data: { userId: user.id, offeringId, role },
  });
  return user;
}

async function makeSession(
  offeringId: number,
  type: "DEBUGGING" | "REGULAR",
  status: "SCHEDULED" | "COMPLETED" | "ACTIVE",
) {
  const start = new Date();
  start.setHours(10, 0, 0, 0);
  return prisma.officeHourSession.create({
    data: {
      offeringId,
      title: "Stats Session",
      type,
      startsAt: start,
      endsAt: new Date(start.getTime() + 60 * 60_000),
      status,
    },
  });
}

async function addRecord(
  sessionId: number,
  studentId: number,
  helped: boolean,
) {
  const checkedInAt = new Date();
  return prisma.officeHourAttendanceRecord.create({
    data: {
      sessionId,
      studentId,
      checkedInAt,
      helpStartedAt: helped
        ? new Date(checkedInAt.getTime() + 2 * 60_000)
        : null,
      helpEndedAt: helped
        ? new Date(checkedInAt.getTime() + 12 * 60_000)
        : null,
      outcome: helped ? "COMPLETED" : "NO_SHOW",
    },
  });
}

async function main() {
  console.log("=== course-stats.test.ts ===\n");
  await cleanupAll();

  // 1. Scoped to the given offering only
  await runTest("scoped to the given offering only", async () => {
    await cleanupAll();
    const offeringA = await makeOffering("1a");
    const offeringB = await makeOffering("1b");
    await makeSession(offeringA.id, "DEBUGGING", "COMPLETED");

    const resultB = await getSessionStatsForOffering(offeringB.id);
    assertEqual(resultB.length, 0, "no sessions for the other offering");
    const resultA = await getSessionStatsForOffering(offeringA.id);
    assertEqual(resultA.length, 1, "this offering's session returned");
  });

  // 2. COMPLETED debugging session → metrics computed
  await runTest("completed session → four metrics computed", async () => {
    await cleanupAll();
    const offering = await makeOffering("2");
    const session = await makeSession(offering.id, "DEBUGGING", "COMPLETED");

    const s1 = await makeUser("s1", offering.id, "STUDENT");
    const s2 = await makeUser("s2", offering.id, "STUDENT");
    const s3 = await makeUser("s3", offering.id, "STUDENT");

    await addRecord(session.id, s1.id, true); // checked in + helped
    await addRecord(session.id, s2.id, false); // checked in, not helped (no-show)

    // interest: s1 (came), s2 (came), s3 (did not come)
    await prisma.officeHourInterest.createMany({
      data: [
        { sessionId: session.id, userId: s1.id },
        { sessionId: session.id, userId: s2.id },
        { sessionId: session.id, userId: s3.id },
      ],
    });

    const [row] = await getSessionStatsForOffering(offering.id);
    assert(row !== undefined, "one session returned");
    assertEqual(row.checkedIn, 2, "checkedIn");
    assertEqual(row.gotHelp, 1, "gotHelp");
    assertEqual(row.interested, 3, "interested");
    assertEqual(row.interestedShowed, 2, "interestedShowed");
  });

  // 3. SCHEDULED session → attendance metrics null, interested numeric
  await runTest(
    "scheduled session → attendance NA, interested numeric",
    async () => {
      await cleanupAll();
      const offering = await makeOffering("3");
      const session = await makeSession(offering.id, "DEBUGGING", "SCHEDULED");
      const s1 = await makeUser("s31", offering.id, "STUDENT");
      await prisma.officeHourInterest.create({
        data: { sessionId: session.id, userId: s1.id },
      });

      const [row] = await getSessionStatsForOffering(offering.id);
      assertEqual(row.checkedIn, null, "checkedIn NA");
      assertEqual(row.gotHelp, null, "gotHelp NA");
      assertEqual(row.interestedShowed, null, "interestedShowed NA");
      assertEqual(row.interested, 1, "interested numeric");
    },
  );

  // 4. Only DEBUGGING returned
  await runTest("only DEBUGGING sessions returned", async () => {
    await cleanupAll();
    const offering = await makeOffering("4");
    await makeSession(offering.id, "DEBUGGING", "COMPLETED");
    await makeSession(offering.id, "REGULAR", "COMPLETED");

    const result = await getSessionStatsForOffering(offering.id);
    assertEqual(result.length, 1, "only the debugging session");
  });

  // 5. Two sessions: interestedShowed computed per session, no cross-talk.
  // (Guards the batched in-memory grouping that replaced the N+1 queries.)
  await runTest("interestedShowed is per-session, no cross-talk", async () => {
    await cleanupAll();
    const offering = await makeOffering("5");
    const sA = await makeSession(offering.id, "DEBUGGING", "COMPLETED");
    const sB = await makeSession(offering.id, "DEBUGGING", "COMPLETED");
    const alice = await makeUser("a5", offering.id, "STUDENT");
    const bob = await makeUser("b5", offering.id, "STUDENT");

    // A: alice checks in; alice + bob both interested in A (bob never comes to A)
    await addRecord(sA.id, alice.id, true);
    await prisma.officeHourInterest.createMany({
      data: [
        { sessionId: sA.id, userId: alice.id },
        { sessionId: sA.id, userId: bob.id },
      ],
    });
    // B: bob checks in and is interested in B
    await addRecord(sB.id, bob.id, true);
    await prisma.officeHourInterest.create({
      data: { sessionId: sB.id, userId: bob.id },
    });

    const rows = await getSessionStatsForOffering(offering.id);
    const a = rows.find((r) => r.sessionPublicId === sA.publicId)!;
    const b = rows.find((r) => r.sessionPublicId === sB.publicId)!;

    assertEqual(a.interested, 2, "A interested (alice, bob)");
    assertEqual(a.checkedIn, 1, "A checkedIn (alice)");
    assertEqual(
      a.interestedShowed,
      1,
      "A showed (alice only; bob didn't come to A)",
    );
    assertEqual(b.interested, 1, "B interested (bob)");
    assertEqual(b.checkedIn, 1, "B checkedIn (bob)");
    assertEqual(b.interestedShowed, 1, "B showed (bob)");
  });

  // 6. ACTIVE session is treated as having attendance data (not NA)
  await runTest("ACTIVE session exposes attendance metrics", async () => {
    await cleanupAll();
    const offering = await makeOffering("6");
    const s = await makeSession(offering.id, "DEBUGGING", "ACTIVE");
    const stu = await makeUser("s6", offering.id, "STUDENT");
    await addRecord(s.id, stu.id, true);

    const [row] = await getSessionStatsForOffering(offering.id);
    assertEqual(row.checkedIn, 1, "ACTIVE checkedIn not NA");
    assertEqual(row.gotHelp, 1, "ACTIVE gotHelp not NA");
  });

  await cleanupAll();
  await finishTests();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
