/**
 * Tests: admin offerings list
 *
 * How to run:
 *   pnpm dlx tsx src/lib/tests/adminOfferings.test.ts
 *
 * Prerequisite: DATABASE_URL must be configured.
 */

import "dotenv/config";

import { listAllOfferings } from "@/lib/queries/admin/offerings";
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
        platformRowA !== undefined,
        "platform instructor should see offering A",
      );
      assert(superAdminRowA !== undefined, "super-admin should see offering A");

      assertEqual(
        instructorRowA!.canAddInstructor,
        true,
        "course instructor can add on their course",
      );
      assertEqual(
        instructorRowB!.canAddInstructor,
        true,
        "course instructor can add on another course they teach",
      );
      assertEqual(
        platformRowA!.canAddInstructor,
        false,
        "platform instructor without membership cannot add",
      );
      assertEqual(
        superAdminRowA!.canAddInstructor,
        true,
        "super-admin can add on any course",
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
