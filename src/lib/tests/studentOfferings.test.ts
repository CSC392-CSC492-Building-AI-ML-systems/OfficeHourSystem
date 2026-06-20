/**
 * Tests: student course portal list
 *
 * How to run:
 *   pnpm dlx tsx src/lib/tests/studentOfferings.test.ts
 */

import "dotenv/config";

import { listStudentOfferings } from "@/lib/queries/student/offerings";
import { studentDashboardHref } from "@/lib/offeringUrls";
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
  console.log("=== studentOfferings.test.ts ===\n");

  await cleanupAll();

  const course = await prisma.course.create({
    data: { code: `${TEST_PREFIX}CSC108H5` },
  });
  const offering = await prisma.courseOffering.create({
    data: { courseId: course.id, termCode: TEST_TERM },
  });

  const student = await prisma.user.create({
    data: { utorid: `${TEST_PREFIX}portal_student` },
  });
  const outsider = await prisma.user.create({
    data: { utorid: `${TEST_PREFIX}portal_outsider` },
  });

  await prisma.offeringMember.create({
    data: {
      userId: student.id,
      offeringId: offering.id,
      role: "STUDENT",
    },
  });

  await runTest(
    "listStudentOfferings → returns enrolled courses with student dashboard links",
    async () => {
      const list = await listStudentOfferings(student.id);
      assertEqual(list.length, 1, "student should have one course");
      assertEqual(list[0]!.courseCode, `${TEST_PREFIX}CSC108H5`, "course code");
      assertEqual(
        list[0]!.workspaceHref,
        studentDashboardHref(offering.publicId),
        "workspace href",
      );
    },
  );

  await runTest(
    "listStudentOfferings → empty for user without student enrollments",
    async () => {
      const list = await listStudentOfferings(outsider.id);
      assertEqual(list.length, 0, "outsider should have no courses");
    },
  );

  await cleanupAll();
  await finishTests();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
