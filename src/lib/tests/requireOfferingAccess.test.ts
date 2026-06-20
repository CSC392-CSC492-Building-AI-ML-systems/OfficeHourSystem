/**
 * Tests: per-offering instructor/TA access gates
 *
 * How to run:
 *   pnpm dlx tsx src/lib/tests/requireOfferingAccess.test.ts
 *
 * Prerequisite: DATABASE_URL must be configured.
 */

import "dotenv/config";

import {
  OfferingAccessError,
  getOfferingContextForUser,
  requireOfferingTeachingStaff,
} from "@/lib/auth/requireOfferingAccess";
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

async function setupOffering() {
  const course = await prisma.course.create({
    data: { code: `${TEST_PREFIX}CSC492H5` },
  });

  const offering = await prisma.courseOffering.create({
    data: { courseId: course.id, termCode: TEST_TERM },
  });

  return { course, offering };
}

async function createUser(suffix: string) {
  return prisma.user.create({
    data: { utorid: `${TEST_PREFIX}${suffix}` },
  });
}

async function enroll(
  userId: number,
  offeringId: number,
  role: "INSTRUCTOR" | "TA" | "STUDENT",
) {
  await prisma.offeringMember.create({
    data: { userId, offeringId: offeringId, role },
  });
}

async function main() {
  console.log("=== requireOfferingAccess.test.ts ===\n");

  await cleanupAll();
  const { offering } = await setupOffering();

  const instructor = await createUser("course_instructor");
  const ta = await createUser("course_ta");
  const student = await createUser("course_student");
  const outsider = await createUser("outsider");

  await enroll(instructor.id, offering.id, "INSTRUCTOR");
  await enroll(ta.id, offering.id, "TA");
  await enroll(student.id, offering.id, "STUDENT");

  await runTest(
    "requireOfferingTeachingStaff → missing offering param",
    async () => {
      let threw = false;
      try {
        await requireOfferingTeachingStaff(outsider.id, "");
      } catch (error) {
        threw = true;
        assert(
          error instanceof OfferingAccessError,
          "expected OfferingAccessError",
        );
        assertEqual(
          (error as OfferingAccessError).code,
          "missing",
          "error code",
        );
      }
      assert(threw, "should throw for missing offering");
    },
  );

  await runTest(
    "requireOfferingTeachingStaff → offering not found",
    async () => {
      let threw = false;
      try {
        await requireOfferingTeachingStaff(
          outsider.id,
          "nonexistent-offering-id",
        );
      } catch (error) {
        threw = true;
        assert(
          error instanceof OfferingAccessError,
          "expected OfferingAccessError",
        );
        assertEqual(
          (error as OfferingAccessError).code,
          "not_found",
          "error code",
        );
      }
      assert(threw, "should throw for unknown offering");
    },
  );

  await runTest(
    "requireOfferingTeachingStaff → forbidden without membership",
    async () => {
      let threw = false;
      try {
        await requireOfferingTeachingStaff(outsider.id, offering.publicId);
      } catch (error) {
        threw = true;
        assert(
          error instanceof OfferingAccessError,
          "expected OfferingAccessError",
        );
        assertEqual(
          (error as OfferingAccessError).code,
          "forbidden",
          "error code",
        );
      }
      assert(threw, "outsider should be forbidden");
    },
  );

  await runTest(
    "requireOfferingTeachingStaff → forbidden for STUDENT membership",
    async () => {
      let threw = false;
      try {
        await requireOfferingTeachingStaff(student.id, offering.publicId);
      } catch (error) {
        threw = true;
        assert(
          error instanceof OfferingAccessError,
          "expected OfferingAccessError",
        );
        assertEqual(
          (error as OfferingAccessError).code,
          "forbidden",
          "error code",
        );
      }
      assert(threw, "student should be forbidden from instructor area");
    },
  );

  await runTest(
    "requireOfferingTeachingStaff → allows INSTRUCTOR with canEdit",
    async () => {
      const context = await requireOfferingTeachingStaff(
        instructor.id,
        offering.publicId,
      );

      assertEqual(context.role, "INSTRUCTOR", "role");
      assertEqual(context.canEdit, true, "canEdit");
      assertEqual(context.offeringPublicId, offering.publicId, "publicId");
      assertEqual(context.courseCode, `${TEST_PREFIX}CSC492H5`, "course code");
      assertEqual(context.termCode, TEST_TERM, "term code");
    },
  );

  await runTest(
    "requireOfferingTeachingStaff → allows TA without canEdit",
    async () => {
      const context = await requireOfferingTeachingStaff(
        ta.id,
        offering.publicId,
      );

      assertEqual(context.role, "TA", "role");
      assertEqual(context.canEdit, false, "canEdit");
    },
  );

  await runTest(
    "getOfferingContextForUser → null when user has no membership",
    async () => {
      const context = await getOfferingContextForUser(
        outsider.id,
        offering.publicId,
      );
      assert(context === null, "should return null without membership");
    },
  );

  await cleanupAll();
  await finishTests();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
