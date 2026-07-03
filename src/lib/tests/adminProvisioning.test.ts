/**
 * Tests: admin provisioning flows (bulk instructors, per-offering instructors, classlist bootstrap)
 *
 * How to run:
 *   pnpm dlx tsx src/lib/tests/adminProvisioning.test.ts
 *
 * Prerequisite: DATABASE_URL must be configured.
 */

import "dotenv/config";

import { bulkUpsertInstructorsFromText } from "@/lib/queries/admin/bulkUpsertInstructors";
import { importClasslist, type ClasslistRow } from "@/lib/queries/classlist";
import { addOrUpdateStaffMember } from "@/lib/queries/offeringMember";
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

function makeStudentNumber(suffix: string): string {
  const numericPart = Array.from(suffix).reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );
  return `101${String(numericPart).padStart(7, "0")}`;
}

function makeRow(
  suffix: string,
  overrides: Partial<ClasslistRow> = {},
): ClasslistRow {
  return {
    Acad_act: `${TEST_PREFIX}CSC492H5`,
    Email: `${TEST_PREFIX}${suffix}@mail.utoronto.ca`,
    Surname: "Test",
    "Given Name": suffix,
    "Person ID": makeStudentNumber(suffix),
    UTORid: `${TEST_PREFIX}${suffix}`,
    ...overrides,
  };
}

async function setupOffering() {
  const course = await prisma.course.create({
    data: { code: `${TEST_PREFIX}CSC492H5` },
  });

  const offering = await prisma.courseOffering.create({
    data: { courseId: course.id, termCode: TEST_TERM },
  });

  return { course, offering };
}

async function main() {
  console.log("=== adminProvisioning.test.ts ===\n");

  await cleanupAll();

  await runTest(
    "bulkUpsertInstructorsFromText → creates user with isInstructor true",
    async () => {
      const utorid = `${TEST_PREFIX}bulk_new`;
      const result = await bulkUpsertInstructorsFromText(`${utorid}\n`);

      assert(result.ok, "bulk upsert should succeed");
      if (!result.ok) return;

      assertEqual(result.created, 1, "created count");
      assertEqual(result.updated, 0, "updated count");

      const user = await prisma.user.findUnique({ where: { utorid } });
      assert(user !== null, "user should exist");
      assertEqual(user!.isInstructor, true, "isInstructor flag");
    },
  );

  await runTest(
    "bulkUpsertInstructorsFromText → updates existing user to isInstructor true",
    async () => {
      const utorid = `${TEST_PREFIX}bulk_existing`;
      await prisma.user.create({
        data: { utorid, isInstructor: false },
      });

      const result = await bulkUpsertInstructorsFromText(`${utorid}\n`);
      assert(result.ok, "bulk upsert should succeed");
      if (!result.ok) return;

      assertEqual(result.created, 0, "created count");
      assertEqual(result.updated, 1, "updated count");

      const user = await prisma.user.findUnique({ where: { utorid } });
      assertEqual(user!.isInstructor, true, "isInstructor flag");
    },
  );

  await runTest(
    "addOrUpdateStaffMember (per-offering) → creates minimal user without isInstructor",
    async () => {
      const { offering } = await setupOffering();
      const utorid = `${TEST_PREFIX}per_course_new`;

      const result = await addOrUpdateStaffMember(
        { utorid },
        { publicId: offering.publicId },
        "INSTRUCTOR",
      );

      assertEqual(result.created, true, "membership created");

      const user = await prisma.user.findUnique({ where: { utorid } });
      assert(user !== null, "user should be created");
      assertEqual(
        user!.isInstructor,
        false,
        "should not set platform instructor flag",
      );

      const membership = await prisma.offeringMember.findUnique({
        where: {
          userId_offeringId: {
            userId: user!.id,
            offeringId: offering.id,
          },
        },
      });
      assert(membership !== null, "membership should exist");
      assertEqual(membership!.role, "INSTRUCTOR", "offering role");
    },
  );

  await runTest(
    "classlist import + uploader link → returns offeringPublicId and grants course access",
    async () => {
      await cleanupAll();

      const uploader = await prisma.user.create({
        data: {
          utorid: `${TEST_PREFIX}uploader`,
          isInstructor: true,
        },
      });

      const rows = [makeRow("student1"), makeRow("student2")];
      const importResult = await importClasslist({ termCode: TEST_TERM, rows });

      assert(
        importResult.offeringPublicId.length > 0,
        "import should return offeringPublicId",
      );

      const offering = await prisma.courseOffering.findUnique({
        where: { publicId: importResult.offeringPublicId },
      });
      assert(offering !== null, "offering should exist in DB");
      assertEqual(
        importResult.offeringPublicId,
        offering!.publicId,
        "offeringPublicId should match DB",
      );

      await addOrUpdateStaffMember(
        { utorid: uploader.utorid },
        { publicId: importResult.offeringPublicId },
        "INSTRUCTOR",
      );

      const membership = await prisma.offeringMember.findUnique({
        where: {
          userId_offeringId: {
            userId: uploader.id,
            offeringId: offering!.id,
          },
        },
      });

      assert(membership !== null, "uploader should be linked to offering");
      assertEqual(membership!.role, "INSTRUCTOR", "uploader role");

      const outsider = await prisma.user.create({
        data: { utorid: `${TEST_PREFIX}not_linked` },
      });

      const outsiderMembership = await prisma.offeringMember.findUnique({
        where: {
          userId_offeringId: {
            userId: outsider.id,
            offeringId: offering!.id,
          },
        },
      });
      assert(
        outsiderMembership === null,
        "unlinked instructor should not get offering membership automatically",
      );
    },
  );

  await runTest(
    "per-offering instructor without platform flag cannot be implied from classlist alone",
    async () => {
      await cleanupAll();

      const rows = [makeRow("solo_student")];
      await importClasslist({ termCode: TEST_TERM, rows });

      const courseInstructor = `${TEST_PREFIX}course_only`;
      const offering = await prisma.courseOffering.findFirst({
        where: { termCode: TEST_TERM },
      });
      assert(offering !== null, "offering should exist");

      await addOrUpdateStaffMember(
        { utorid: courseInstructor },
        { publicId: offering!.publicId },
        "INSTRUCTOR",
      );

      const user = await prisma.user.findUnique({
        where: { utorid: courseInstructor },
      });
      assertEqual(user!.isInstructor, false, "no platform instructor flag");
    },
  );

  await cleanupAll();
  await finishTests();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
