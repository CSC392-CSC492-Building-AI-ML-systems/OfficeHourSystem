import "dotenv/config";

import { assertSessionOperator } from "@/lib/auth/sessionOperator";
import { prisma } from "@/lib/prisma";
import {
  TEST_PREFIX,
  TEST_TERM,
  assert,
  assertEqual,
  cleanupAll,
  finishTests,
  runTest,
} from "./_seed";

async function rejectionMessage(operation: () => Promise<unknown>) {
  try {
    await operation();
    return "";
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

async function main() {
  console.log("=== sessionOperator.test.ts ===\n");
  await cleanupAll();

  const course = await prisma.course.create({
    data: { code: `${TEST_PREFIX}QUEUE101` },
  });
  const offering = await prisma.courseOffering.create({
    data: { courseId: course.id, termCode: TEST_TERM },
  });

  const [instructor, host, nonHost] = await Promise.all([
    prisma.user.create({ data: { utorid: `${TEST_PREFIX}queue_instructor` } }),
    prisma.user.create({ data: { utorid: `${TEST_PREFIX}queue_host` } }),
    prisma.user.create({ data: { utorid: `${TEST_PREFIX}queue_nonhost` } }),
  ]);

  await prisma.offeringMember.createMany({
    data: [
      { userId: instructor.id, offeringId: offering.id, role: "INSTRUCTOR" },
      { userId: host.id, offeringId: offering.id, role: "TA" },
      { userId: nonHost.id, offeringId: offering.id, role: "TA" },
    ],
  });

  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
  const [debugging, regular, group] = await Promise.all(
    (["DEBUGGING", "REGULAR", "GROUP"] as const).map((type) =>
      prisma.officeHourSession.create({
        data: {
          offeringId: offering.id,
          title: `${type} session`,
          type,
          startsAt,
          endsAt,
          status: "SCHEDULED",
        },
      }),
    ),
  );
  const hostRow = await prisma.officeHourSessionHost.create({
    data: {
      sessionId: debugging.id,
      userId: host.id,
      role: "TA",
    },
  });

  await runTest("DEBUGGING allows an offering instructor", async () => {
    const operator = await assertSessionOperator(
      instructor.id,
      debugging.id,
      offering.id,
    );
    assertEqual(operator.isInstructor, true, "instructor should be recognized");
    assertEqual(operator.role, "INSTRUCTOR", "role should be preserved");
  });

  await runTest("DEBUGGING allows a registered session host", async () => {
    const operator = await assertSessionOperator(
      host.id,
      debugging.id,
      offering.id,
    );
    assertEqual(operator.isInstructor, false, "TA is not an instructor");
    assertEqual(operator.hostId, hostRow.id, "host row should be returned");
  });

  for (const session of [regular, group]) {
    await runTest(
      `${session.type} rejects an otherwise authorized instructor`,
      async () => {
        const message = await rejectionMessage(() =>
          assertSessionOperator(instructor.id, session.id, offering.id),
        );
        assert(
          message.includes("Help Centre"),
          "non-Help-Centre session should be rejected",
        );
      },
    );
  }

  await runTest("DEBUGGING still rejects a non-host TA", async () => {
    const message = await rejectionMessage(() =>
      assertSessionOperator(nonHost.id, debugging.id, offering.id),
    );
    assert(
      message.includes("only the course instructor or a host"),
      "existing operator authorization should remain enforced",
    );
  });

  await runTest("session must belong to the supplied offering", async () => {
    const otherCourse = await prisma.course.create({
      data: { code: `${TEST_PREFIX}QUEUE102` },
    });
    const otherOffering = await prisma.courseOffering.create({
      data: { courseId: otherCourse.id, termCode: TEST_TERM },
    });
    await prisma.offeringMember.create({
      data: {
        userId: instructor.id,
        offeringId: otherOffering.id,
        role: "INSTRUCTOR",
      },
    });

    const message = await rejectionMessage(() =>
      assertSessionOperator(instructor.id, debugging.id, otherOffering.id),
    );
    assert(
      message.includes("session not found"),
      "mismatched offering should be rejected",
    );
  });

  await cleanupAll();
  await finishTests();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
