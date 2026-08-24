import "dotenv/config";

import { prisma } from "@/lib/prisma";
import { getUpcomingSessionsForStudent } from "@/lib/queries/student_dashboard/student-dashboard";
import {
  TEST_PREFIX,
  TEST_TERM,
  assert,
  assertEqual,
  cleanupAll,
  finishTests,
  runTest,
} from "../_seed";

function dateAtDayOffset(dayOffset: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  return date;
}

async function main() {
  console.log("=== student-dashboard.test.ts ===\n");
  await cleanupAll();

  const [course, otherCourse, student] = await Promise.all([
    prisma.course.create({ data: { code: `${TEST_PREFIX}DASH101` } }),
    prisma.course.create({ data: { code: `${TEST_PREFIX}DASH102` } }),
    prisma.user.create({ data: { utorid: `${TEST_PREFIX}dashboard_student` } }),
  ]);
  const [offering, otherOffering] = await Promise.all([
    prisma.courseOffering.create({
      data: { courseId: course.id, termCode: TEST_TERM },
    }),
    prisma.courseOffering.create({
      data: { courseId: otherCourse.id, termCode: TEST_TERM },
    }),
  ]);
  await prisma.offeringMember.create({
    data: { userId: student.id, offeringId: offering.id, role: "STUDENT" },
  });

  const eligibleCases = [
    { day: 0, type: "REGULAR", status: "SCHEDULED" },
    { day: 7, type: "GROUP", status: "ACTIVE" },
    { day: 8, type: "DEBUGGING", status: "DELAYED" },
    { day: 13, type: "REGULAR", status: "SCHEDULED" },
    { day: 14, type: "GROUP", status: "SCHEDULED" },
  ] as const;

  const eligibleSessionIds: number[] = [];
  for (const testCase of eligibleCases) {
    const startsAt = dateAtDayOffset(testCase.day);
    const session = await prisma.officeHourSession.create({
      data: {
        offeringId: offering.id,
        title: `Day ${testCase.day}`,
        type: testCase.type,
        startsAt,
        endsAt: new Date(startsAt.getTime() + 60 * 60 * 1000),
        status: testCase.status,
      },
    });
    eligibleSessionIds.push(session.id);
  }

  for (const excluded of [
    { title: "Past", day: -1, offeringId: offering.id, status: "SCHEDULED" },
    { title: "Day 15", day: 15, offeringId: offering.id, status: "SCHEDULED" },
    {
      title: "Other offering",
      day: 1,
      offeringId: otherOffering.id,
      status: "SCHEDULED",
    },
    {
      title: "Cancelled",
      day: 2,
      offeringId: offering.id,
      status: "CANCELLED",
    },
    {
      title: "Completed",
      day: 3,
      offeringId: offering.id,
      status: "COMPLETED",
    },
  ] as const) {
    const startsAt = dateAtDayOffset(excluded.day);
    await prisma.officeHourSession.create({
      data: {
        offeringId: excluded.offeringId,
        title: excluded.title,
        type: "DEBUGGING",
        startsAt,
        endsAt: new Date(startsAt.getTime() + 60 * 60 * 1000),
        status: excluded.status,
      },
    });
  }

  await runTest(
    "upcoming sessions include day 0 through day 14 boundaries",
    async () => {
      const result = await getUpcomingSessionsForStudent(
        student.id,
        offering.publicId,
      );
      assertEqual(result.length, 5, "only eligible horizon sessions returned");
      assertEqual(result[0].id, eligibleSessionIds[0], "day 0 included");
      assertEqual(result[1].id, eligibleSessionIds[1], "day 7 included");
      assertEqual(result[2].id, eligibleSessionIds[2], "day 8 included");
      assertEqual(result[3].id, eligibleSessionIds[3], "day 13 included");
      assertEqual(result[4].id, eligibleSessionIds[4], "day 14 included");
    },
  );

  await runTest(
    "query preserves offering, status, ordering, and type semantics",
    async () => {
      const result = await getUpcomingSessionsForStudent(
        student.id,
        offering.publicId,
      );
      const returnedTypes = new Set(result.map((session) => session.type));
      assert(returnedTypes.has("REGULAR"), "REGULAR remains visible");
      assert(returnedTypes.has("GROUP"), "GROUP remains visible");
      assert(returnedTypes.has("DEBUGGING"), "DEBUGGING remains visible");
      assert(
        result.every(
          (session, index) =>
            index === 0 ||
            result[index - 1].startsAt.getTime() <= session.startsAt.getTime(),
        ),
        "sessions remain chronologically ordered",
      );
      assert(
        result.every((session) =>
          ["SCHEDULED", "ACTIVE", "DELAYED"].includes(session.status),
        ),
        "only existing eligible statuses are returned",
      );
    },
  );

  await runTest("non-member receives no sessions", async () => {
    const outsider = await prisma.user.create({
      data: { utorid: `${TEST_PREFIX}dashboard_outsider` },
    });
    const result = await getUpcomingSessionsForStudent(
      outsider.id,
      offering.publicId,
    );
    assertEqual(result.length, 0, "offering membership remains required");
  });

  await cleanupAll();
  await finishTests();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
