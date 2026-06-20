/**
 * Tests: admin page access (adminList + isInstructor)
 *
 * How to run:
 *   pnpm dlx tsx src/lib/tests/adminAccess.test.ts
 *
 * Prerequisite: DATABASE_URL must be configured.
 */

import "dotenv/config";

import { isAdmin } from "@/lib/adminList";
import {
  canAddOfferingInstructor,
  userCanAccessAdmin,
} from "@/lib/auth/canAccessAdmin";
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
  console.log("=== adminAccess.test.ts ===\n");

  await cleanupAll();

  const platformInstructor = await prisma.user.create({
    data: {
      utorid: `${TEST_PREFIX}platform_instructor`,
      isInstructor: true,
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      utorid: `${TEST_PREFIX}regular_user`,
      isInstructor: false,
    },
  });

  await runTest(
    "userCanAccessAdmin → true when isInstructor is true",
    async () => {
      const allowed = await userCanAccessAdmin(
        platformInstructor.id,
        platformInstructor.utorid,
      );
      assertEqual(allowed, true, "platform instructor should access admin");
    },
  );

  await runTest(
    "userCanAccessAdmin → false when isInstructor is false and not on adminList",
    async () => {
      const allowed = await userCanAccessAdmin(
        regularUser.id,
        regularUser.utorid,
      );
      assertEqual(allowed, false, "regular user should not access admin");
    },
  );

  await runTest("userCanAccessAdmin → false for unknown user id", async () => {
    const allowed = await userCanAccessAdmin(9_999_999, `${TEST_PREFIX}ghost`);
    assertEqual(allowed, false, "unknown user should not access admin");
  });

  await runTest(
    "adminList.txt → isAdmin recognizes configured super-admin UTORids",
    async () => {
      assert(isAdmin("testprof"), "testprof should be listed in adminList.txt");
    },
  );

  await runTest(
    "userCanAccessAdmin → true for adminList UTORid without isInstructor flag",
    async () => {
      const utorid = "testprof";
      const listed =
        (await prisma.user.findUnique({ where: { utorid } })) ??
        (await prisma.user.create({
          data: { utorid, isInstructor: false },
        }));

      const allowed = await userCanAccessAdmin(listed.id, utorid);
      assert(
        allowed,
        "adminList UTORid should access admin even without isInstructor",
      );
    },
  );

  await runTest(
    "canAddOfferingInstructor → true for super-admin on any offering",
    async () => {
      const course = await prisma.course.create({
        data: { code: `${TEST_PREFIX}CSC999H5` },
      });
      const offering = await prisma.courseOffering.create({
        data: { courseId: course.id, termCode: TEST_TERM },
      });

      const allowed = await canAddOfferingInstructor(
        regularUser.id,
        "testprof",
        offering.publicId,
      );
      assertEqual(allowed, true, "super-admin can add on any offering");
    },
  );

  await runTest(
    "canAddOfferingInstructor → true only when viewer is offering instructor",
    async () => {
      const course = await prisma.course.create({
        data: { code: `${TEST_PREFIX}CSC888H5` },
      });
      const offering = await prisma.courseOffering.create({
        data: { courseId: course.id, termCode: TEST_TERM },
      });

      await prisma.offeringMember.create({
        data: {
          userId: platformInstructor.id,
          offeringId: offering.id,
          role: "INSTRUCTOR",
        },
      });

      const allowedForMember = await canAddOfferingInstructor(
        platformInstructor.id,
        platformInstructor.utorid,
        offering.publicId,
      );
      const allowedForOutsider = await canAddOfferingInstructor(
        regularUser.id,
        regularUser.utorid,
        offering.publicId,
      );

      assertEqual(
        allowedForMember,
        true,
        "offering instructor can add instructors",
      );
      assertEqual(
        allowedForOutsider,
        false,
        "non-instructor cannot add instructors",
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
