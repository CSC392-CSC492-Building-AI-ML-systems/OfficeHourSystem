/**
 * Tests: office hour scheduling (recurring expand, one-time, auth, cancel)
 *
 * Run: pnpm dlx tsx src/lib/tests/officeHourScheduling.test.ts
 */

import "dotenv/config";

import { prisma } from "@/lib/prisma";
import {
  cancelSession,
  createOneTimeSession,
  createRecurringBlock,
  deleteRecurringBlock,
  updateRecurringBlock,
  updateSession,
} from "@/lib/queries/officeHourScheduling";
import { expandOfficeHourSchedule } from "@/lib/scheduling/expandSchedule";
import { ScheduleAuthError } from "@/lib/scheduling/auth";
import { formatDateOnlyLocal } from "@/lib/scheduling/time";
import {
  TEST_PREFIX,
  TEST_TERM,
  cleanupAll,
  assert,
  assertEqual,
  runTest,
  finishTests,
} from "./_seed";

function futureWeekdayDate(daysAhead = 4): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  return formatDateOnlyLocal(date);
}

/** A single future Monday for recurring-block tests that update upcoming sessions. */
function upcomingMondayRange(): { validFrom: string; validUntil: string } {
  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  if (monday.getDay() === 1) {
    monday.setDate(monday.getDate() + 7);
  } else {
    monday.setDate(monday.getDate() + ((1 - monday.getDay() + 7) % 7));
  }
  const iso = formatDateOnlyLocal(monday);
  return { validFrom: iso, validUntil: iso };
}

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

    const date = futureWeekdayDate(3);

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

    const date = futureWeekdayDate(2);

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

      const mondayRange = upcomingMondayRange();

      const { schedulePublicIds } = await createRecurringBlock(instructor.id, {
        offeringPublicId: offering.publicId,
        title: "Original Title",
        uiType: "drop-in",
        weekdayKeys: ["mon"],
        startTime: "10:00",
        endTime: "11:00",
        validFrom: mondayRange.validFrom,
        validUntil: mondayRange.validUntil,
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
    "Rejects updating recurring block to overlapping times",
    async () => {
      await cleanupAll();
      const { offering, instructor } = await setupOffering();
      const mondayRange = upcomingMondayRange();

      await createOneTimeSession(instructor.id, {
        offeringPublicId: offering.publicId,
        title: "Existing Monday OH",
        uiType: "drop-in",
        date: mondayRange.validFrom,
        startTime: "11:00",
        endTime: "13:00",
      });

      const { schedulePublicIds } = await createRecurringBlock(instructor.id, {
        offeringPublicId: offering.publicId,
        title: "Monday afternoon block",
        uiType: "drop-in",
        weekdayKeys: ["mon"],
        startTime: "14:00",
        endTime: "16:00",
        validFrom: mondayRange.validFrom,
        validUntil: mondayRange.validUntil,
      });

      let threw = false;
      try {
        await updateRecurringBlock(instructor.id, schedulePublicIds[0], {
          startTime: "12:00",
          endTime: "14:00",
        });
      } catch (error) {
        threw =
          error instanceof Error && error.message.includes("overlaps with");
      }

      assert(threw, "should reject overlapping recurring block update");

      const schedule = await prisma.officeHourSchedule.findUniqueOrThrow({
        where: { publicId: schedulePublicIds[0] },
      });
      assertEqual(schedule.startMinute, 14 * 60, "schedule time unchanged");
    },
  );

  await runTest("Rejects office hours before 8 AM", async () => {
    await cleanupAll();
    const { offering, instructor } = await setupOffering();

    let threw = false;
    try {
      await createRecurringBlock(instructor.id, {
        offeringPublicId: offering.publicId,
        title: "Too Early",
        uiType: "drop-in",
        weekdayKeys: ["mon"],
        startTime: "07:00",
        endTime: "09:00",
      });
    } catch (error) {
      threw =
        error instanceof Error &&
        error.message.includes("cannot start before 8:00 AM");
    }

    assert(threw, "should reject start before 8 AM");
  });

  await runTest("Rejects office hours ending after 10 PM", async () => {
    await cleanupAll();
    const { offering, instructor } = await setupOffering();

    let threw = false;
    try {
      await createRecurringBlock(instructor.id, {
        offeringPublicId: offering.publicId,
        title: "Too Late",
        uiType: "drop-in",
        weekdayKeys: ["tue"],
        startTime: "21:00",
        endTime: "22:30",
      });
    } catch (error) {
      threw =
        error instanceof Error &&
        error.message.includes("cannot end after 10:00 PM");
    }

    assert(threw, "should reject end after 10 PM");
  });

  await runTest(
    "Rejects start times not on the hour or half past",
    async () => {
      await cleanupAll();
      const { offering, instructor } = await setupOffering();

      let threw = false;
      try {
        await createRecurringBlock(instructor.id, {
          offeringPublicId: offering.publicId,
          title: "Odd Start",
          uiType: "drop-in",
          weekdayKeys: ["wed"],
          startTime: "14:17",
          endTime: "15:30",
        });
      } catch (error) {
        threw =
          error instanceof Error &&
          error.message.includes("Start time must be on the hour or half past");
      }

      assert(threw, "should reject odd start minutes");
    },
  );

  await runTest("Rejects office hours shorter than 1 hour", async () => {
    await cleanupAll();
    const { offering, instructor } = await setupOffering();

    let threw = false;
    try {
      await createRecurringBlock(instructor.id, {
        offeringPublicId: offering.publicId,
        title: "Too Short",
        uiType: "drop-in",
        weekdayKeys: ["thu"],
        startTime: "14:00",
        endTime: "14:30",
      });
    } catch (error) {
      threw =
        error instanceof Error &&
        error.message.includes("at least 1 hour long");
    }

    assert(threw, "should reject sub-hour blocks");
  });

  await runTest("Rejects recurring blocks on weekends", async () => {
    await cleanupAll();
    const { offering, instructor } = await setupOffering();

    let threw = false;
    try {
      await createRecurringBlock(instructor.id, {
        offeringPublicId: offering.publicId,
        title: "Weekend block",
        uiType: "drop-in",
        weekdayKeys: ["sat"],
        startTime: "10:00",
        endTime: "11:00",
      });
    } catch (error) {
      threw =
        error instanceof Error &&
        error.message.includes("cannot be scheduled on weekends");
    }

    assert(threw, "should reject Saturday recurring blocks");
  });

  await runTest("Rejects one-time sessions on weekends", async () => {
    await cleanupAll();
    const { offering, instructor } = await setupOffering();

    let threw = false;
    try {
      await createOneTimeSession(instructor.id, {
        offeringPublicId: offering.publicId,
        title: "Saturday session",
        uiType: "drop-in",
        date: "2026-06-13",
        startTime: "10:00",
        endTime: "11:00",
      });
    } catch (error) {
      threw =
        error instanceof Error &&
        error.message.includes("cannot be scheduled on weekends");
    }

    assert(threw, "should reject Saturday one-time sessions");
  });

  await runTest(
    "Allows half-past start times with at least 1 hour duration",
    async () => {
      await cleanupAll();
      const { offering, instructor } = await setupOffering();

      const date = futureWeekdayDate(4);

      const { session } = await createOneTimeSession(instructor.id, {
        offeringPublicId: offering.publicId,
        title: "Half past block",
        uiType: "drop-in",
        date,
        startTime: "14:30",
        endTime: "15:30",
      });

      assertEqual(session.startTime, "2:30 PM", "start label");
      assertEqual(session.endTime, "3:30 PM", "end label");
    },
  );

  await runTest("Rejects one-time session that overlaps exactly", async () => {
    await cleanupAll();
    const { offering, instructor } = await setupOffering();
    const date = futureWeekdayDate(3);

    await createOneTimeSession(instructor.id, {
      offeringPublicId: offering.publicId,
      title: "Existing OH",
      uiType: "drop-in",
      date,
      startTime: "11:00",
      endTime: "13:00",
    });

    let threw = false;
    try {
      await createOneTimeSession(instructor.id, {
        offeringPublicId: offering.publicId,
        title: "Duplicate OH",
        uiType: "drop-in",
        date,
        startTime: "11:00",
        endTime: "13:00",
      });
    } catch (error) {
      threw = error instanceof Error && error.message.includes("overlaps with");
    }

    assert(threw, "should reject exact overlap");
  });

  await runTest(
    "Rejects one-time session that partially overlaps",
    async () => {
      await cleanupAll();
      const { offering, instructor } = await setupOffering();
      const date = futureWeekdayDate(3);

      await createOneTimeSession(instructor.id, {
        offeringPublicId: offering.publicId,
        title: "Existing OH",
        uiType: "drop-in",
        date,
        startTime: "11:00",
        endTime: "13:00",
      });

      let threw = false;
      try {
        await createOneTimeSession(instructor.id, {
          offeringPublicId: offering.publicId,
          title: "Overlapping OH",
          uiType: "drop-in",
          date,
          startTime: "12:00",
          endTime: "14:00",
        });
      } catch (error) {
        threw =
          error instanceof Error && error.message.includes("overlaps with");
      }

      assert(threw, "should reject partial overlap");
    },
  );

  await runTest(
    "Rejects one-time session that fully contains another",
    async () => {
      await cleanupAll();
      const { offering, instructor } = await setupOffering();
      const date = futureWeekdayDate(3);

      await createOneTimeSession(instructor.id, {
        offeringPublicId: offering.publicId,
        title: "Existing OH",
        uiType: "drop-in",
        date,
        startTime: "11:00",
        endTime: "13:00",
      });

      let threw = false;
      try {
        await createOneTimeSession(instructor.id, {
          offeringPublicId: offering.publicId,
          title: "Wide OH",
          uiType: "drop-in",
          date,
          startTime: "09:00",
          endTime: "12:00",
        });
      } catch (error) {
        threw =
          error instanceof Error && error.message.includes("overlaps with");
      }

      assert(threw, "should reject containing overlap");
    },
  );

  await runTest("Allows non-overlapping sessions on the same day", async () => {
    await cleanupAll();
    const { offering, instructor } = await setupOffering();
    const date = futureWeekdayDate(3);

    await createOneTimeSession(instructor.id, {
      offeringPublicId: offering.publicId,
      title: "Morning OH",
      uiType: "drop-in",
      date,
      startTime: "11:00",
      endTime: "13:00",
    });

    const { session } = await createOneTimeSession(instructor.id, {
      offeringPublicId: offering.publicId,
      title: "Afternoon OH",
      uiType: "drop-in",
      date,
      startTime: "14:00",
      endTime: "16:00",
    });

    assertEqual(session.title, "Afternoon OH", "second session created");
  });

  await runTest(
    "Rejects recurring block that overlaps existing recurring block",
    async () => {
      await cleanupAll();
      const { offering, instructor } = await setupOffering();

      await createRecurringBlock(instructor.id, {
        offeringPublicId: offering.publicId,
        title: "Thursday OH",
        uiType: "drop-in",
        weekdayKeys: ["thu"],
        startTime: "11:00",
        endTime: "13:00",
        validFrom: "2026-06-11",
        validUntil: "2026-06-18",
      });

      let threw = false;
      try {
        await createRecurringBlock(instructor.id, {
          offeringPublicId: offering.publicId,
          title: "Overlapping Thursday OH",
          uiType: "drop-in",
          weekdayKeys: ["thu"],
          startTime: "12:00",
          endTime: "14:00",
          validFrom: "2026-06-11",
          validUntil: "2026-06-18",
        });
      } catch (error) {
        threw =
          error instanceof Error && error.message.includes("overlaps with");
      }

      assert(threw, "should reject overlapping recurring blocks");
    },
  );

  await runTest(
    "Rejects recurring block that overlaps a one-time session",
    async () => {
      await cleanupAll();
      const { offering, instructor } = await setupOffering();

      await createOneTimeSession(instructor.id, {
        offeringPublicId: offering.publicId,
        title: "One-time Thursday",
        uiType: "drop-in",
        date: "2026-06-11",
        startTime: "11:00",
        endTime: "13:00",
      });

      let threw = false;
      try {
        await createRecurringBlock(instructor.id, {
          offeringPublicId: offering.publicId,
          title: "Thursday recurring",
          uiType: "drop-in",
          weekdayKeys: ["thu"],
          startTime: "11:00",
          endTime: "13:00",
          validFrom: "2026-06-11",
          validUntil: "2026-06-18",
        });
      } catch (error) {
        threw =
          error instanceof Error && error.message.includes("overlaps with");
      }

      assert(threw, "should reject recurring block overlapping one-time");
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

  await runTest("updateSession changes time and host", async () => {
    await cleanupAll();
    const { offering, instructor, ta } = await setupOffering();
    const date = futureWeekdayDate(5);

    const { session } = await createOneTimeSession(instructor.id, {
      offeringPublicId: offering.publicId,
      title: "Editable session",
      uiType: "drop-in",
      date,
      startTime: "14:00",
      endTime: "15:00",
      hostUserPublicIds: [instructor.publicId],
    });

    const updated = await updateSession(instructor.id, session.id, {
      startTime: "15:00",
      endTime: "16:00",
      hostUserPublicIds: [ta.publicId],
    });

    assertEqual(updated.session.startTimeInput, "15:00", "start time updated");
    assertEqual(updated.session.endTimeInput, "16:00", "end time updated");
    assertEqual(updated.session.hostPublicIds, [ta.publicId], "host updated");
    assert(updated.session.hasOverride !== true, "one-time is not an override");
  });

  await runTest(
    "updateSession time override detected on recurring session",
    async () => {
      await cleanupAll();
      const { offering, instructor } = await setupOffering();

      await createRecurringBlock(instructor.id, {
        offeringPublicId: offering.publicId,
        title: "Weekly OH",
        uiType: "drop-in",
        weekdayKeys: ["wed"],
        startTime: "14:00",
        endTime: "15:00",
        validFrom: "2026-06-10",
        validUntil: "2026-06-10",
      });

      const session = await prisma.officeHourSession.findFirstOrThrow({
        where: { offeringId: offering.id },
      });

      const updated = await updateSession(instructor.id, session.publicId, {
        startTime: "15:00",
        endTime: "16:00",
      });

      assertEqual(updated.session.hasOverride, true, "time override flagged");
      assertEqual(
        updated.session.startTimeInput,
        "15:00",
        "start time updated",
      );
    },
  );

  await finishTests();
}

void main();
