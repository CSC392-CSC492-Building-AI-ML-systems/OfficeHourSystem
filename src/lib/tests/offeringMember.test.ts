/**
 * Tests: getMemberRole() / addOrUpdateStaffMember()
 *
 * How to run:
 *   pnpm dlx tsx tests/lib/offeringMember.test.ts
 *
 * Prerequisite: DATABASE_URL must be configured in .env or as an environment variable.
 *
 * ── getMemberRole scenarios ─────────────────────────────────────────────────
 *   1. User does not exist                  → returns null
 *   2. Offering does not exist              → returns null
 *   3. User exists but not in offering      → returns null
 *   4. Query by utorid                      → correctly returns role
 *   5. Query by email                       → correctly returns role
 *   6. Query by user publicId               → correctly returns role
 *   7. Query by offering publicId           → correctly returns role
 *   8. Query by courseCode + termCode       → correctly returns role
 *
 * ── addOrUpdateStaffMember scenarios ────────────────────────────────────────
 *   9.  Attempt to set STUDENT role          → throws (safety restriction)
 *  10.  User does not exist (including unknown UTORid) → throws
 *  11.  Offering does not exist              → throws
 *  12.  Add INSTRUCTOR (user not yet in offering) → created=true, correct role
 *  13.  Add TA                               → created=true, correct role
 *  14.  Add another INSTRUCTOR               → created=true, correct role
 *  15.  Update existing member role (TA → INSTRUCTOR) → created=false, role updated
 *  16.  User is STUDENT → cannot be promoted to TA
 */

// Must be the first import to ensure DATABASE_URL is injected before the prisma.ts module loads
import "dotenv/config";

import { prisma } from "@/lib/prisma";
import {
  addOfferingStudent,
  getMemberRole,
  addOrUpdateStaffMember,
} from "@/lib/queries/offeringMember";
import {
  TEST_PREFIX,
  TEST_TERM,
  cleanupAll,
  assert,
  assertEqual,
  runTest,
  finishTests,
} from "./_seed";

/**
 * Create a minimal test scenario:
 *   course → offering → user (not pre-enrolled in the offering)
 *
 * Individual test cases enroll the user into the offering as needed.
 */
async function setupScenario() {
  const course = await prisma.course.create({
    data: { code: `${TEST_PREFIX}CSC392H5` },
  });

  const offering = await prisma.courseOffering.create({
    data: { courseId: course.id, termCode: TEST_TERM },
  });

  const user = await prisma.user.create({
    data: {
      utorid: `${TEST_PREFIX}staffuser`,
      email: `${TEST_PREFIX}staffuser@mail.utoronto.ca`,
      studentNumber: "1011662169",
      firstName: "Staff",
      lastName: "User",
    },
  });

  return { course, offering, user };
}

async function main() {
  console.log("=== offeringMember.test.ts ===\n");

  await cleanupAll();
  const { course, offering, user } = await setupScenario();

  // ── Test 1: user does not exist → null ───────────────────────────────────
  await runTest("getMemberRole: user does not exist → null", async () => {
    const result = await getMemberRole(
      { utorid: `${TEST_PREFIX}nobody` },
      { publicId: offering.publicId },
    );
    assertEqual(result, null, "should return null");
  });

  // ── Test 2: offering does not exist → null ───────────────────────────────
  await runTest("getMemberRole: Offering does not exist → null", async () => {
    const result = await getMemberRole(
      { utorid: user.utorid },
      { publicId: "nonexistent-public-id" },
    );
    assertEqual(result, null, "should return null");
  });

  // ── Test 3: user exists but not in offering → null ───────────────────────
  await runTest("getMemberRole: user not in offering → null", async () => {
    const result = await getMemberRole(
      { utorid: user.utorid },
      { publicId: offering.publicId },
    );
    assertEqual(result, null, "should return null");
  });

  // Add user to offering as INSTRUCTOR first, for use in subsequent query tests
  await prisma.offeringMember.create({
    data: { userId: user.id, offeringId: offering.id, role: "INSTRUCTOR" },
  });

  // ── Test 4: query by utorid ───────────────────────────────────────────────
  await runTest(
    "getMemberRole: query by utorid → returns correct role",
    async () => {
      const result = await getMemberRole(
        { utorid: user.utorid },
        { publicId: offering.publicId },
      );
      assert(result !== null, "should not return null");
      assertEqual(result!.role, "INSTRUCTOR", "role should be INSTRUCTOR");
    },
  );

  // ── Test 5: query by email ────────────────────────────────────────────────
  await runTest(
    "getMemberRole: query by email → returns correct role",
    async () => {
      const result = await getMemberRole(
        { email: user.email! },
        { publicId: offering.publicId },
      );
      assert(result !== null, "should not return null");
      assertEqual(result!.role, "INSTRUCTOR", "role should be INSTRUCTOR");
    },
  );

  await runTest(
    "getMemberRole: query by student number returns correct role",
    async () => {
      const result = await getMemberRole(
        { studentNumber: user.studentNumber! },
        { publicId: offering.publicId },
      );
      assert(result !== null, "should not return null");
      assertEqual(result!.role, "INSTRUCTOR", "role should be INSTRUCTOR");
    },
  );

  // ── Test 6: query by user publicId ───────────────────────────────────────
  await runTest(
    "getMemberRole: query by user publicId → returns correct role",
    async () => {
      const result = await getMemberRole(
        { publicId: user.publicId },
        { publicId: offering.publicId },
      );
      assert(result !== null, "should not return null");
      assertEqual(result!.role, "INSTRUCTOR", "role should be INSTRUCTOR");
    },
  );

  // ── Test 7: query by offering publicId ───────────────────────────────────
  await runTest(
    "getMemberRole: query by offering publicId → returns correct role",
    async () => {
      const result = await getMemberRole(
        { utorid: user.utorid },
        { publicId: offering.publicId },
      );
      assert(result !== null, "should not return null");
      assertEqual(result!.role, "INSTRUCTOR", "role should be INSTRUCTOR");
    },
  );

  // ── Test 8: query by courseCode + termCode ───────────────────────────────
  await runTest(
    "getMemberRole: query by courseCode + termCode → returns correct role",
    async () => {
      const result = await getMemberRole(
        { utorid: user.utorid },
        { courseCode: course.code, termCode: TEST_TERM },
      );
      assert(result !== null, "should not return null");
      assertEqual(result!.role, "INSTRUCTOR", "role should be INSTRUCTOR");
    },
  );

  // ── Test 9: attempt to set STUDENT role → throws (safety check) ──────────
  await runTest(
    "addOrUpdateStaffMember: set STUDENT role → throws",
    async () => {
      let errorMsg = "";
      try {
        await addOrUpdateStaffMember(
          { utorid: user.utorid },
          { publicId: offering.publicId },
          "STUDENT",
        );
      } catch (e) {
        errorMsg = (e as Error).message;
      }
      assert(errorMsg.length > 0, "should have thrown an error");
      assert(
        errorMsg.includes("STUDENT role cannot be assigned"),
        `Error message should mention the STUDENT restriction, got: ${errorMsg}`,
      );
    },
  );

  // ── Test 10: non-UTORid lookup with no user → throws ─────────────────────
  await runTest(
    "addOrUpdateStaffMember: email lookup with no user → throws",
    async () => {
      let errorMsg = "";
      try {
        await addOrUpdateStaffMember(
          { email: `${TEST_PREFIX}nobody@mail.utoronto.ca` },
          { publicId: offering.publicId },
          "TA",
        );
      } catch (e) {
        errorMsg = (e as Error).message;
      }
      assert(
        errorMsg.includes("User not found"),
        `Should contain 'User not found', got: ${errorMsg}`,
      );
    },
  );

  // ── Test 10b: unknown UTORid → throws (must sign in first) ───────────────
  await runTest(
    "addOrUpdateStaffMember: unknown UTORid → throws User not found",
    async () => {
      let errorMsg = "";
      try {
        await addOrUpdateStaffMember(
          { utorid: `${TEST_PREFIX}utoridonly` },
          { publicId: offering.publicId },
          "TA",
        );
      } catch (e) {
        errorMsg = (e as Error).message;
      }
      assert(
        errorMsg.includes("User not found"),
        `Should contain 'User not found', got: ${errorMsg}`,
      );
    },
  );

  // ── Test 11: offering does not exist → throws ─────────────────────────────
  await runTest(
    "addOrUpdateStaffMember: Offering does not exist → throws",
    async () => {
      let errorMsg = "";
      try {
        await addOrUpdateStaffMember(
          { utorid: user.utorid },
          { publicId: "nonexistent-public-id" },
          "TA",
        );
      } catch (e) {
        errorMsg = (e as Error).message;
      }
      assert(
        errorMsg.includes("Course offering not found"),
        `Should contain 'Course offering not found', got: ${errorMsg}`,
      );
    },
  );

  // Subsequent tests need a new user not yet enrolled in the offering
  const freshUser = await prisma.user.create({
    data: {
      utorid: `${TEST_PREFIX}freshuser`,
      email: `${TEST_PREFIX}freshuser@mail.utoronto.ca`,
      firstName: "Fresh",
      lastName: "User",
    },
  });

  // ── Test 12: add INSTRUCTOR → created=true ────────────────────────────────
  await runTest(
    "addOrUpdateStaffMember: add INSTRUCTOR → created=true",
    async () => {
      const result = await addOrUpdateStaffMember(
        { utorid: freshUser.utorid },
        { publicId: offering.publicId },
        "INSTRUCTOR",
      );
      assertEqual(result.role, "INSTRUCTOR", "role should be INSTRUCTOR");
      assertEqual(result.created, true, "should be newly created");

      // Verify getMemberRole also finds it
      const check = await getMemberRole(
        { utorid: freshUser.utorid },
        { publicId: offering.publicId },
      );
      assertEqual(
        check?.role,
        "INSTRUCTOR",
        "getMemberRole should return INSTRUCTOR",
      );
    },
  );

  // ── Test 13: add TA ───────────────────────────────────────────────────────
  await runTest("addOrUpdateStaffMember: add TA → created=true", async () => {
    const taUser = await prisma.user.create({
      data: {
        utorid: `${TEST_PREFIX}tauser`,
        email: `${TEST_PREFIX}tauser@mail.utoronto.ca`,
        firstName: "TA",
        lastName: "User",
      },
    });
    const result = await addOrUpdateStaffMember(
      { utorid: taUser.utorid },
      { publicId: offering.publicId },
      "TA",
    );
    assertEqual(result.role, "TA", "role should be TA");
    assertEqual(result.created, true, "should be newly created");
  });

  // ── Test 14: add another INSTRUCTOR ───────────────────────────────────────
  await runTest(
    "addOrUpdateStaffMember: add another INSTRUCTOR → created=true",
    async () => {
      const instructorUser = await prisma.user.create({
        data: {
          utorid: `${TEST_PREFIX}instructoruser`,
          email: `${TEST_PREFIX}instructoruser@mail.utoronto.ca`,
          firstName: "Instructor",
          lastName: "User",
        },
      });
      const result = await addOrUpdateStaffMember(
        { utorid: instructorUser.utorid },
        { publicId: offering.publicId },
        "INSTRUCTOR",
      );
      assertEqual(result.role, "INSTRUCTOR", "role should be INSTRUCTOR");
      assertEqual(result.created, true, "should be newly created");
    },
  );

  // ── Test 15: update existing member role (TA → INSTRUCTOR) → created=false ─
  await runTest(
    "addOrUpdateStaffMember: TA → INSTRUCTOR → created=false, role updated",
    async () => {
      // freshUser is currently INSTRUCTOR (set in test 12), change to TA then back
      const toTA = await addOrUpdateStaffMember(
        { utorid: freshUser.utorid },
        { publicId: offering.publicId },
        "TA",
      );
      assertEqual(toTA.role, "TA", "should be updated to TA");
      assertEqual(
        toTA.created,
        false,
        "should be an update (not a new creation)",
      );

      const back = await addOrUpdateStaffMember(
        { utorid: freshUser.utorid },
        { publicId: offering.publicId },
        "INSTRUCTOR",
      );
      assertEqual(
        back.role,
        "INSTRUCTOR",
        "should be updated back to INSTRUCTOR",
      );
      assertEqual(
        back.created,
        false,
        "should be an update (not a new creation)",
      );
    },
  );

  // ── Test 16: user is STUDENT → cannot be promoted to TA ─────────────────
  await runTest(
    "addOrUpdateStaffMember: STUDENT cannot be promoted to TA",
    async () => {
      // Simulate a student imported via classlist
      const studentUser = await prisma.user.create({
        data: {
          utorid: `${TEST_PREFIX}studenttobe`,
          email: `${TEST_PREFIX}studenttobe@mail.utoronto.ca`,
          firstName: "Student",
          lastName: "ToBeTA",
        },
      });
      await prisma.offeringMember.create({
        data: {
          userId: studentUser.id,
          offeringId: offering.id,
          role: "STUDENT",
        },
      });

      // Confirm current role is STUDENT
      const before = await getMemberRole(
        { utorid: studentUser.utorid },
        { publicId: offering.publicId },
      );
      assertEqual(
        before?.role,
        "STUDENT",
        "role should be STUDENT before promotion attempt",
      );

      let errorMsg = "";
      try {
        await addOrUpdateStaffMember(
          { utorid: studentUser.utorid },
          { publicId: offering.publicId },
          "TA",
        );
      } catch (e) {
        errorMsg = (e as Error).message;
      }
      assert(
        errorMsg.includes("enrolled as a student"),
        `Should reject student promotion, got: ${errorMsg}`,
      );

      const after = await getMemberRole(
        { utorid: studentUser.utorid },
        { publicId: offering.publicId },
      );
      assertEqual(after?.role, "STUDENT", "role should remain STUDENT");
    },
  );

  await runTest(
    "addOfferingStudent: creates a minimal normalized user and membership",
    async () => {
      const result = await addOfferingStudent(
        offering.publicId,
        `  ${TEST_PREFIX}QuickNew  `,
      );

      assertEqual(
        result.utorid,
        `${TEST_PREFIX}quicknew`,
        "UTORid should be trimmed and lowercased",
      );
      assertEqual(result.name, result.utorid, "minimal user name uses UTORid");
      assertEqual(result.email, "", "minimal user has no invented email");

      const createdUser = await prisma.user.findUnique({
        where: { utorid: result.utorid },
      });
      assert(createdUser !== null, "global user should be created");
      assertEqual(createdUser!.email, null, "email should remain null");

      const membership = await prisma.offeringMember.findUnique({
        where: {
          userId_offeringId: {
            userId: createdUser!.id,
            offeringId: offering.id,
          },
        },
      });
      assertEqual(membership?.role, "STUDENT", "student membership is created");
    },
  );

  await runTest(
    "addOfferingStudent: enrolls an existing global user",
    async () => {
      const existingUser = await prisma.user.create({
        data: {
          utorid: `${TEST_PREFIX}existing_student`,
          firstName: "Existing",
          lastName: "Student",
        },
      });

      const result = await addOfferingStudent(
        offering.publicId,
        existingUser.utorid,
      );
      assertEqual(
        result.id,
        existingUser.publicId,
        "returns existing user DTO",
      );

      const role = await getMemberRole(
        { utorid: existingUser.utorid },
        { publicId: offering.publicId },
      );
      assertEqual(role?.role, "STUDENT", "existing user should be enrolled");
    },
  );

  await runTest(
    "addOfferingStudent: existing STUDENT membership is idempotent",
    async () => {
      const student = await prisma.user.create({
        data: { utorid: `${TEST_PREFIX}already_student` },
      });
      await prisma.offeringMember.create({
        data: {
          userId: student.id,
          offeringId: offering.id,
          role: "STUDENT",
        },
      });

      const first = await addOfferingStudent(offering.publicId, student.utorid);
      const second = await addOfferingStudent(
        offering.publicId,
        student.utorid,
      );
      assertEqual(first.id, second.id, "idempotent call returns same student");

      const count = await prisma.offeringMember.count({
        where: { userId: student.id, offeringId: offering.id },
      });
      assertEqual(count, 1, "should not create duplicate memberships");
    },
  );

  for (const role of ["TA", "INSTRUCTOR"] as const) {
    await runTest(
      `addOfferingStudent: existing ${role} role is preserved`,
      async () => {
        const staffUser = await prisma.user.create({
          data: {
            utorid: `${TEST_PREFIX}student_conflict_${role.toLowerCase()}`,
          },
        });
        await prisma.offeringMember.create({
          data: { userId: staffUser.id, offeringId: offering.id, role },
        });

        let errorMessage = "";
        try {
          await addOfferingStudent(offering.publicId, staffUser.utorid);
        } catch (error) {
          errorMessage = (error as Error).message;
        }
        assert(
          errorMessage.includes("cannot be added as a student"),
          "staff role conflict should be explained",
        );

        const membership = await prisma.offeringMember.findUnique({
          where: {
            userId_offeringId: {
              userId: staffUser.id,
              offeringId: offering.id,
            },
          },
        });
        assertEqual(
          membership?.role,
          role,
          "staff role must not be overwritten",
        );
      },
    );
  }

  await runTest(
    "addOfferingStudent: missing offering rolls back user creation",
    async () => {
      const missingUtorid = `${TEST_PREFIX}missing_offering_student`;
      let errorMessage = "";
      try {
        await addOfferingStudent("missing-offering", missingUtorid);
      } catch (error) {
        errorMessage = (error as Error).message;
      }
      assert(
        errorMessage.includes("Course offering not found"),
        "missing offering should fail cleanly",
      );

      const userAfterFailure = await prisma.user.findUnique({
        where: { utorid: missingUtorid },
      });
      assertEqual(userAfterFailure, null, "failed operation creates no user");
    },
  );

  await runTest("addOfferingStudent: empty UTORid is rejected", async () => {
    let errorMessage = "";
    try {
      await addOfferingStudent(offering.publicId, "   ");
    } catch (error) {
      errorMessage = (error as Error).message;
    }
    assertEqual(errorMessage, "UTORid is required", "empty UTORid error");
  });

  // Cleanup
  await cleanupAll();
  await finishTests();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
