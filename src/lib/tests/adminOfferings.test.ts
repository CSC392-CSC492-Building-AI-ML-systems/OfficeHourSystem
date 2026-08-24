/**
 * Tests: admin offerings list
 *
 * How to run:
 *   pnpm dlx tsx src/lib/tests/adminOfferings.test.ts
 *
 * Prerequisite: DATABASE_URL must be configured.
 */

import "dotenv/config";

import {
  listAllOfferings,
  deleteOffering,
} from "@/lib/queries/admin/offerings";
import { instructorDashboardHref } from "@/lib/offeringUrls";
import { prisma } from "@/lib/prisma";
import {
  TEST_PREFIX,
  TEST_TERM,
  cleanupAll,
  assert,
  assertEqual,
  runTest,
  finishTests,
} from "./_seed";

async function main() {
  console.log("=== adminOfferings.test.ts ===\n");

  await cleanupAll();

  const courseA = await prisma.course.create({
    data: { code: `${TEST_PREFIX}CSC108H5` },
  });
  const courseB = await prisma.course.create({
    data: { code: `${TEST_PREFIX}CSC148H5` },
  });

  const offeringA = await prisma.courseOffering.create({
    data: { courseId: courseA.id, termCode: TEST_TERM },
  });
  const offeringB = await prisma.courseOffering.create({
    data: { courseId: courseB.id, termCode: TEST_TERM },
  });

  const instructor = await prisma.user.create({
    data: { utorid: `${TEST_PREFIX}list_instructor` },
  });
  const student1 = await prisma.user.create({
    data: { utorid: `${TEST_PREFIX}list_student1` },
  });
  const student2 = await prisma.user.create({
    data: { utorid: `${TEST_PREFIX}list_student2` },
  });

  await prisma.offeringMember.createMany({
    data: [
      {
        userId: instructor.id,
        offeringId: offeringA.id,
        role: "INSTRUCTOR",
      },
      {
        userId: student1.id,
        offeringId: offeringA.id,
        role: "STUDENT",
      },
      {
        userId: student2.id,
        offeringId: offeringA.id,
        role: "STUDENT",
      },
      {
        userId: instructor.id,
        offeringId: offeringB.id,
        role: "INSTRUCTOR",
      },
    ],
  });

  await runTest(
    "listAllOfferings → includes test offerings with correct member counts",
    async () => {
      const list = await listAllOfferings({
        viewerUserId: instructor.id,
        viewerIsSuperAdmin: false,
      });

      const rowA = list.find(
        (item) => item.offeringPublicId === offeringA.publicId,
      );
      const rowB = list.find(
        (item) => item.offeringPublicId === offeringB.publicId,
      );

      assert(rowA !== undefined, "offering A should be listed");
      assert(rowB !== undefined, "offering B should be listed");

      assertEqual(rowA!.courseCode, `${TEST_PREFIX}CSC108H5`, "course A code");
      assertEqual(rowA!.termCode, TEST_TERM, "course A term");
      assertEqual(rowA!.studentCount, 2, "course A students");
      assertEqual(rowA!.instructorCount, 1, "course A instructors");

      assertEqual(rowB!.courseCode, `${TEST_PREFIX}CSC148H5`, "course B code");
      assertEqual(rowB!.studentCount, 0, "course B students");
      assertEqual(rowB!.instructorCount, 1, "course B instructors");
    },
  );

  await runTest(
    "listAllOfferings → same term sorted by course code ascending",
    async () => {
      const list = await listAllOfferings({
        viewerUserId: instructor.id,
        viewerIsSuperAdmin: false,
      });
      const testRows = list.filter((item) =>
        item.courseCode.startsWith(TEST_PREFIX),
      );

      assert(testRows.length >= 2, "should include both test offerings");

      const indexA = testRows.findIndex(
        (row) => row.offeringPublicId === offeringA.publicId,
      );
      const indexB = testRows.findIndex(
        (row) => row.offeringPublicId === offeringB.publicId,
      );

      assert(
        indexA < indexB,
        "CSC108 should appear before CSC148 when term codes match",
      );
    },
  );

  const platformInstructor = await prisma.user.create({
    data: {
      utorid: `${TEST_PREFIX}platform_only`,
      isInstructor: true,
    },
  });

  await runTest(
    "listAllOfferings → non-super-admin only sees staff courses",
    async () => {
      const platformView = await listAllOfferings({
        viewerUserId: platformInstructor.id,
        viewerIsSuperAdmin: false,
      });
      const testRows = platformView.filter((item) =>
        item.courseCode.startsWith(TEST_PREFIX),
      );
      assertEqual(
        testRows.length,
        0,
        "platform instructor sees no test offerings",
      );
    },
  );

  await runTest(
    "listAllOfferings → canAddInstructor true only for courses the viewer teaches",
    async () => {
      const instructorView = await listAllOfferings({
        viewerUserId: instructor.id,
        viewerIsSuperAdmin: false,
      });
      const platformView = await listAllOfferings({
        viewerUserId: platformInstructor.id,
        viewerIsSuperAdmin: false,
      });
      const superAdminView = await listAllOfferings({
        viewerUserId: platformInstructor.id,
        viewerIsSuperAdmin: true,
      });

      const instructorRowA = instructorView.find(
        (item) => item.offeringPublicId === offeringA.publicId,
      );
      const instructorRowB = instructorView.find(
        (item) => item.offeringPublicId === offeringB.publicId,
      );
      const platformRowA = platformView.find(
        (item) => item.offeringPublicId === offeringA.publicId,
      );
      const superAdminRowA = superAdminView.find(
        (item) => item.offeringPublicId === offeringA.publicId,
      );

      assert(instructorRowA !== undefined, "instructor should see offering A");
      assert(instructorRowB !== undefined, "instructor should see offering B");
      assert(
        platformRowA === undefined,
        "platform instructor without membership should not see offering A",
      );
      assert(superAdminRowA !== undefined, "super-admin should see offering A");

      assertEqual(
        instructorRowA!.canAddInstructor,
        true,
        "course instructor can add on their course",
      );
      assertEqual(
        instructorRowA!.canOpenCourse,
        true,
        "course instructor can open workspace",
      );
      assertEqual(
        instructorRowA!.workspaceHref,
        instructorDashboardHref(offeringA.publicId),
        "instructor workspace href",
      );
      assertEqual(
        instructorRowB!.canAddInstructor,
        true,
        "course instructor can add on another course they teach",
      );
      assertEqual(
        platformRowA,
        undefined,
        "platform instructor without membership cannot add",
      );
      assertEqual(
        superAdminRowA!.canAddInstructor,
        true,
        "super-admin can add on any course",
      );
      assertEqual(
        superAdminRowA!.canOpenCourse,
        false,
        "super-admin without membership cannot open until added",
      );
    },
  );

  await runTest("deleteOffering → missing offering throws", async () => {
    let errorMsg = "";
    try {
      await deleteOffering("does-not-exist");
    } catch (error) {
      errorMsg = (error as Error).message;
    }
    assert(
      errorMsg.includes("Course offering not found"),
      `expected not-found error, got: ${errorMsg}`,
    );
  });

  await runTest(
    "deleteOffering → removes sessions, attendance, interests, and unused course",
    async () => {
      const course = await prisma.course.create({
        data: { code: `${TEST_PREFIX}DEL108H5` },
      });
      const offering = await prisma.courseOffering.create({
        data: { courseId: course.id, termCode: TEST_TERM },
      });
      const instructor = await prisma.user.create({
        data: { utorid: `${TEST_PREFIX}del_instructor` },
      });
      const student = await prisma.user.create({
        data: { utorid: `${TEST_PREFIX}del_student` },
      });

      await prisma.offeringMember.createMany({
        data: [
          {
            userId: instructor.id,
            offeringId: offering.id,
            role: "INSTRUCTOR",
          },
          { userId: student.id, offeringId: offering.id, role: "STUDENT" },
        ],
      });

      const schedule = await prisma.officeHourSchedule.create({
        data: {
          offeringId: offering.id,
          title: "Delete me",
          type: "REGULAR",
          dayOfWeek: 1,
          startMinute: 14 * 60,
          endMinute: 15 * 60,
        },
      });
      await prisma.officeHourScheduleHost.create({
        data: {
          scheduleId: schedule.id,
          userId: instructor.id,
          role: "INSTRUCTOR",
        },
      });

      const startsAt = new Date("2026-01-12T19:00:00.000Z");
      const session = await prisma.officeHourSession.create({
        data: {
          offeringId: offering.id,
          scheduleId: schedule.id,
          title: "Delete me session",
          type: "REGULAR",
          startsAt,
          endsAt: new Date(startsAt.getTime() + 60 * 60 * 1000),
          status: "COMPLETED",
        },
      });
      const host = await prisma.officeHourSessionHost.create({
        data: {
          sessionId: session.id,
          userId: instructor.id,
          role: "INSTRUCTOR",
        },
      });

      const interest = await prisma.officeHourInterest.create({
        data: { userId: student.id, sessionId: session.id },
      });
      await prisma.officeHourReminder.create({
        data: { interestId: interest.id, minutesBefore: 60 },
      });
      await prisma.officeHourAttendance.create({
        data: {
          sessionId: session.id,
          studentId: student.id,
          helpedByHostId: host.id,
          status: "IN_HELP",
        },
      });
      await prisma.officeHourAttendanceRecord.create({
        data: {
          sessionId: session.id,
          studentId: student.id,
          helpedByHostId: host.id,
          checkedInAt: startsAt,
          helpEndedAt: new Date(startsAt.getTime() + 10 * 60 * 1000),
          outcome: "COMPLETED",
        },
      });

      await deleteOffering(offering.publicId);

      assertEqual(
        await prisma.courseOffering.count({ where: { id: offering.id } }),
        0,
        "offering deleted",
      );
      assertEqual(
        await prisma.course.count({ where: { id: course.id } }),
        0,
        "unused course deleted",
      );
      assertEqual(
        await prisma.officeHourSession.count({ where: { id: session.id } }),
        0,
        "session deleted",
      );
      assertEqual(
        await prisma.officeHourInterest.count({ where: { id: interest.id } }),
        0,
        "interest deleted",
      );
      assertEqual(
        await prisma.user.count({ where: { id: student.id } }),
        1,
        "student user remains",
      );
    },
  );

  await runTest(
    "deleteOffering → keeps Course when another offering remains",
    async () => {
      const course = await prisma.course.create({
        data: { code: `${TEST_PREFIX}DEL148H5` },
      });
      const first = await prisma.courseOffering.create({
        data: { courseId: course.id, termCode: `${TEST_TERM}_A` },
      });
      const second = await prisma.courseOffering.create({
        data: { courseId: course.id, termCode: `${TEST_TERM}_B` },
      });

      await deleteOffering(first.publicId);

      assertEqual(
        await prisma.courseOffering.count({ where: { id: first.id } }),
        0,
        "first offering deleted",
      );
      assertEqual(
        await prisma.courseOffering.count({ where: { id: second.id } }),
        1,
        "second offering remains",
      );
      assertEqual(
        await prisma.course.count({ where: { id: course.id } }),
        1,
        "shared course remains",
      );

      await deleteOffering(second.publicId);
      assertEqual(
        await prisma.course.count({ where: { id: course.id } }),
        0,
        "course deleted after last offering",
      );
    },
  );

  await cleanupAll();
  await finishTests();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
