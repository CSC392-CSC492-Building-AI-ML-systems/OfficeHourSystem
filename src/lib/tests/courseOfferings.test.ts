/**
 * Tests: course picker offering list
 *
 * How to run:
 *   pnpm dlx tsx src/lib/tests/courseOfferings.test.ts
 */

import "dotenv/config";

import { listCoursePickerOfferings } from "@/lib/queries/course/offerings";
import {
  instructorDashboardHref,
  studentDashboardHref,
} from "@/lib/offeringUrls";
import { prisma } from "@/lib/prisma";
import {
  TEST_PREFIX,
  TEST_TERM,
  cleanupAll,
  assertEqual,
  runTest,
  finishTests,
} from "./_seed";

async function main() {
  console.log("=== courseOfferings.test.ts ===\n");

  await cleanupAll();

  const course = await prisma.course.create({
    data: { code: `${TEST_PREFIX}CSC108H5` },
  });
  const offering = await prisma.courseOffering.create({
    data: { courseId: course.id, termCode: TEST_TERM },
  });

  const instructor = await prisma.user.create({
    data: {
      utorid: `${TEST_PREFIX}picker_instr`,
      firstName: "Ada",
      lastName: "Lovelace",
    },
  });
  const student = await prisma.user.create({
    data: { utorid: `${TEST_PREFIX}picker_student` },
  });

  await prisma.offeringMember.createMany({
    data: [
      {
        userId: instructor.id,
        offeringId: offering.id,
        role: "INSTRUCTOR",
      },
      {
        userId: student.id,
        offeringId: offering.id,
        role: "STUDENT",
      },
    ],
  });

  await runTest(
    "listCoursePickerOfferings → role, instructors, and student href",
    async () => {
      const list = await listCoursePickerOfferings(student.id);
      assertEqual(list.length, 1, "one course");
      assertEqual(list[0]!.roleLabel, "Student", "role label");
      assertEqual(list[0]!.instructorNames.join(","), "Ada Lovelace", "instr");
      assertEqual(
        list[0]!.href,
        studentDashboardHref(offering.publicId),
        "student href",
      );
    },
  );

  await runTest(
    "listCoursePickerOfferings → instructor gets instructor workspace href",
    async () => {
      const list = await listCoursePickerOfferings(instructor.id);
      assertEqual(list.length, 1, "one course");
      assertEqual(list[0]!.roleLabel, "Instructor", "role label");
      assertEqual(
        list[0]!.href,
        instructorDashboardHref(offering.publicId),
        "instructor href",
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
