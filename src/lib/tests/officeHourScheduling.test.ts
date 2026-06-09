/**
 * Tests: office hour scheduling (recurring expand, one-time, auth, cancel)
 *
 * Run: npx tsx src/lib/tests/officeHourScheduling.test.ts
 */

import "dotenv/config";

import { prisma } from "@/lib/prisma";
import {
  cancelSession,
  createOneTimeSession,
  createRecurringBlock,
  deleteRecurringBlock,
  updateRecurringBlock,
} from "@/lib/queries/officeHourScheduling";
import { expandOfficeHourSchedule } from "@/lib/scheduling/expandSchedule";
import { ScheduleAuthError } from "@/lib/scheduling/auth";
import {
  TEST_PREFIX,
  TEST_TERM,
  cleanupAll,
  assert,
  assertEqual,
  runTest,
  finishTests,
} from "./_seed";

async function setupOffering() {
  const course = await prisma.course.create({
    data: { code: `${TEST_PREFIX}SCHED` },
  });
  const offering = await prisma.courseOffering.create({
    data: { courseId: course.id, termCode: TEST_TERM },
  });

  const instructor = await prisma.user.create({
    data: {
      utorid: `${TEST_PREFIX}instr`,
      email: `${TEST_PREFIX}instr@mail.utoronto.ca`,
      firstName: "Instr",
      lastName: "Uctor",
    },
  });

  const ta = await prisma.user.create({
    data: {
      utorid: `${TEST_PREFIX}ta`,
      email: `${TEST_PREFIX}ta@mail.utoronto.ca`,
      firstName: "Teach",
      lastName: "Assist",
    },
  });

  await prisma.offeringMember.create({
    data: {
      userId: instructor.id,
      offeringId: offering.id,
      role: "INSTRUCTOR",
    },
  });

  await prisma.offeringMember.create({
    data: {
      userId: ta.id,
      offeringId: offering.id,
      role: "TA",
    },
  });

  return { offering, instructor, ta };
}

async function main() {
  console.log("\nofficeHourScheduling tests\n");

  await runTest("TA cannot create recurring block", async () => {
    await cleanupAll();
    const { offering, ta } = await setupOffering();

    let threw = false;
    try {
      await createRecurringBlock(ta.id, {
        offeringPublicId: offering.publicId,
        title: "Weekly OH",
        uiType: "drop-in",
        weekdayKeys: ["tue"],
        startTime: "14:00",
        endTime: "16:00",
      });
    } catch (error) {
      threw = error instanceof ScheduleAuthError;
    }

    assert(threw, "TA should not mutate schedule");
  });

  await runTest(
    "Instructor creates recurring block and expands sessions",
    async () => {
      await cleanupAll();
      const { offering, instructor } = await setupOffering();

      const result = await createRecurringBlock(instructor.id, {
        offeringPublicId: offering.publicId,
        title: "Weekly Drop-in",
        uiType: "drop-in",
        weekdayKeys: ["tue", "thu"],
        startTime: "14:00",
        endTime: "15:00",
      });

      assertEqual(result.schedulePublicIds.length, 2, "schedule rows");
      assert(result.sessionsCreated > 0, "sessions should be generated");

      const sessions = await prisma.officeHourSession.findMany({
        where: { offeringId: offering.id },
      });
      assert(sessions.length > 0, "sessions exist in DB");
    },
  );

  await runTest(
    "Custom validFrom/validUntil limits session generation",
    async () => {
      await cleanupAll();
      const { offering, instructor } = await setupOffering();

      await createRecurringBlock(instructor.id, {
        offeringPublicId: offering.publicId,
        title: "Short Monday block",
        uiType: "drop-in",
        weekdayKeys: ["mon"],
        startTime: "10:00",
        endTime: "11:00",
        validFrom: "2026-06-08",
        validUntil: "2026-06-14",
      });

      const sessions = await prisma.officeHourSession.findMany({
        where: { offeringId: offering.id },
      });
      assertEqual(sessions.length, 1, "one Monday in the custom range");
    },
  );

  await runTest("Expand is idempotent", async () => {
    await cleanupAll();
    const { offering, instructor } = await setupOffering();

    const { schedulePublicIds } = await createRecurringBlock(instructor.id, {
      offeringPublicId: offering.publicId,
      title: "Idempotent",
      uiType: "drop-in",
      weekdayKeys: ["wed"],
      startTime: "10:00",
      endTime: "11:00",
    });

    const schedule = await prisma.officeHourSchedule.findUniqueOrThrow({
      where: { publicId: schedulePublicIds[0] },
    });

    const first = await expandOfficeHourSchedule(schedule.id);
    const second = await expandOfficeHourSchedule(schedule.id);
    assertEqual(second.created, 0, "second expand creates nothing");
    assert(first.created >= 0, "first expand ok");
  });

  await runTest("One-time debugging session has no scheduleId", async () => {
    await cleanupAll();
    const { offering, instructor } = await setupOffering();

    const future = new Date();
    future.setDate(future.getDate() + 3);
    const date = future.toISOString().slice(0, 10);

    await createOneTimeSession(instructor.id, {
      offeringPublicId: offering.publicId,
      title: "Pre-assignment debugging",
      uiType: "debugging-queue",
      date,
      startTime: "13:00",
      endTime: "15:00",
    });

    const session = await prisma.officeHourSession.findFirstOrThrow({
      where: { offeringId: offering.id, type: "DEBUGGING" },
    });

    assertEqual(session.scheduleId, null, "one-time has no schedule");
    assertEqual(session.type, "DEBUGGING", "debugging type");
  });

  await runTest("Cancel session sets CANCELLED status", async () => {
    await cleanupAll();
    const { offering, instructor } = await setupOffering();

    const future = new Date();
    future.setDate(future.getDate() + 2);
    const date = future.toISOString().slice(0, 10);

    const { session } = await createOneTimeSession(instructor.id, {
      offeringPublicId: offering.publicId,
      title: "Cancel me",
      uiType: "drop-in",
      date,
      startTime: "09:00",
      endTime: "10:00",
    });

    await cancelSession(instructor.id, session.id);
    const updated = await prisma.officeHourSession.findUniqueOrThrow({
      where: { publicId: session.id },
    });
    assertEqual(updated.status, "CANCELLED", "status cancelled");
  });

  await runTest(
    "Update recurring block updates upcoming sessions",
    async () => {
      await cleanupAll();
      const { offering, instructor } = await setupOffering();

      const { schedulePublicIds } = await createRecurringBlock(instructor.id, {
        offeringPublicId: offering.publicId,
        title: "Original Title",
        uiType: "drop-in",
        weekdayKeys: ["mon"],
        startTime: "10:00",
        endTime: "11:00",
        validFrom: "2026-06-08",
        validUntil: "2026-06-14",
        location: "Room 100",
      });

      await updateRecurringBlock(instructor.id, schedulePublicIds[0], {
        title: "Updated Title",
        location: "Room 200",
        startTime: "13:00",
        endTime: "14:00",
      });

      const schedule = await prisma.officeHourSchedule.findUniqueOrThrow({
        where: { publicId: schedulePublicIds[0] },
      });
      assertEqual(schedule.title, "Updated Title", "schedule title");
      assertEqual(schedule.location, "Room 200", "schedule location");
      assertEqual(schedule.startMinute, 13 * 60, "schedule start");

      const session = await prisma.officeHourSession.findFirstOrThrow({
        where: { scheduleId: schedule.id },
      });
      assertEqual(session.title, "Updated Title", "session title");
      assertEqual(session.location, "Room 200", "session location");
    },
  );

  await runTest(
    "Delete recurring block cancels scheduled sessions",
    async () => {
      await cleanupAll();
      const { offering, instructor } = await setupOffering();

      const { schedulePublicIds } = await createRecurringBlock(instructor.id, {
        offeringPublicId: offering.publicId,
        title: "Delete Me",
        uiType: "drop-in",
        weekdayKeys: ["tue"],
        startTime: "09:00",
        endTime: "10:00",
        validFrom: "2026-06-09",
        validUntil: "2026-06-16",
      });

      await deleteRecurringBlock(instructor.id, schedulePublicIds[0]);

      const schedule = await prisma.officeHourSchedule.findUniqueOrThrow({
        where: { publicId: schedulePublicIds[0] },
      });
      assertEqual(schedule.isActive, false, "schedule deactivated");

      const sessions = await prisma.officeHourSession.findMany({
        where: { scheduleId: schedule.id },
      });
      assert(
        sessions.every((session) => session.status === "CANCELLED"),
        "all sessions cancelled",
      );
    },
  );

  await finishTests();
}

void main();
