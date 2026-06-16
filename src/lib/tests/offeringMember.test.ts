/**
 * Tests: getMemberRole() / addOrUpdateStaffMember()
 *
 * How to run:
 *   npx tsx tests/lib/offeringMember.test.ts
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
 *  10.  User does not exist                  → throws
 *  11.  Offering does not exist              → throws
 *  12.  Add INSTRUCTOR (user not yet in offering) → created=true, correct role
 *  13.  Add TA                               → created=true, correct role
 *  14.  Add ADMIN                            → created=true, correct role
 *  15.  Update existing member role (TA → INSTRUCTOR) → created=false, role updated
 *  16.  User is STUDENT, can be promoted to TA via this function → role updated (normal upgrade flow)
 */

// Must be the first import to ensure DATABASE_URL is injected before the prisma.ts module loads
import "dotenv/config";

import { prisma } from "@/lib/prisma";
import {
  getMemberRole,
  addOrUpdateStaffMember,
  addTaMember,
  deactivateTaMember,
  listActiveTas,
} from "@/lib/queries/offeringMember";
import {
  INACTIVE_OFFERING_MEMBER_STATUS,
  offeringMemberRoleStatusSelect,
  offeringMemberRow,
  type OfferingMemberRoleStatus,
} from "@/lib/queries/offeringMemberConstants";
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

  // ── Test 10b: unknown UTORid → creates user and membership ───────────────
  await runTest(
    "addOrUpdateStaffMember: unknown UTORid → creates user and membership",
    async () => {
      const utorid = `${TEST_PREFIX}utoridonly`;
      const result = await addOrUpdateStaffMember(
        { utorid },
        { publicId: offering.publicId },
        "TA",
      );

      assertEqual(result.role, "TA", "role should be TA");
      assertEqual(result.created, true, "membership should be newly created");

      const createdUser = await prisma.user.findUnique({
        where: { utorid },
        select: { email: true, firstName: true, lastName: true },
      });
      assert(createdUser !== null, "user row should exist");
      assertEqual(createdUser?.email, null, "email should be unset");
      assertEqual(createdUser?.firstName, null, "firstName should be unset");
      assertEqual(createdUser?.lastName, null, "lastName should be unset");
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

  // ── Test 16: user is STUDENT, can be promoted to TA ─────────────────────
  await runTest(
    "addOrUpdateStaffMember: STUDENT can be promoted to TA (upgrade flow)",
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
        "role should be STUDENT before promotion",
      );

      // Promote to TA
      const result = await addOrUpdateStaffMember(
        { utorid: studentUser.utorid },
        { publicId: offering.publicId },
        "TA",
      );
      assertEqual(result.role, "TA", "role should be TA after promotion");
      assertEqual(
        result.created,
        false,
        "should be an update (not a new creation)",
      );

      // Confirm with getMemberRole again
      const after = await getMemberRole(
        { utorid: studentUser.utorid },
        { publicId: offering.publicId },
      );
      assertEqual(after?.role, "TA", "getMemberRole should return TA");
    },
  );

  // ── Test 17: inactive members are hidden from getMemberRole ───────────────
  await runTest("getMemberRole: inactive member → returns null", async () => {
    const inactiveTa = await prisma.user.create({
      data: {
        utorid: `${TEST_PREFIX}inactive-ta`,
        email: `${TEST_PREFIX}inactive-ta@mail.utoronto.ca`,
      },
    });

    await prisma.offeringMember.create({
      data: offeringMemberRow({
        userId: inactiveTa.id,
        offeringId: offering.id,
        role: "TA",
        status: INACTIVE_OFFERING_MEMBER_STATUS,
      }),
    });

    const result = await getMemberRole(
      { utorid: inactiveTa.utorid },
      { publicId: offering.publicId },
    );
    assertEqual(result, null, "inactive member should return null");
  });

  // ── Test 18: addTaMember returns already_added for active TA ──────────────
  await runTest("addTaMember: active TA → already_added", async () => {
    const taUser = await prisma.user.create({
      data: { utorid: `${TEST_PREFIX}active-ta` },
    });

    await prisma.offeringMember.create({
      data: offeringMemberRow({
        userId: taUser.id,
        offeringId: offering.id,
        role: "TA",
      }),
    });

    const result = await addTaMember(
      { utorid: taUser.utorid },
      { publicId: offering.publicId },
    );
    assertEqual(result.outcome, "already_added", "should report already added");
  });

  // ── Test 19: addTaMember reactivates inactive TA ──────────────────────────
  await runTest("addTaMember: inactive TA → reactivated", async () => {
    const taUser = await prisma.user.create({
      data: { utorid: `${TEST_PREFIX}reactivate-ta` },
    });

    await prisma.offeringMember.create({
      data: offeringMemberRow({
        userId: taUser.id,
        offeringId: offering.id,
        role: "TA",
        status: INACTIVE_OFFERING_MEMBER_STATUS,
      }),
    });

    const result = await addTaMember(
      { utorid: taUser.utorid },
      { publicId: offering.publicId },
    );
    assertEqual(result.outcome, "reactivated", "should reactivate inactive TA");

    const role = await getMemberRole(
      { utorid: taUser.utorid },
      { publicId: offering.publicId },
    );
    assertEqual(role?.role, "TA", "reactivated TA should be visible again");
  });

  // ── Test 20: deactivateTaMember marks TA inactive ─────────────────────────
  await runTest("deactivateTaMember: active TA → removed", async () => {
    const taUser = await prisma.user.create({
      data: { utorid: `${TEST_PREFIX}remove-ta` },
    });

    await prisma.offeringMember.create({
      data: offeringMemberRow({
        userId: taUser.id,
        offeringId: offering.id,
        role: "TA",
      }),
    });

    const result = await deactivateTaMember(
      { publicId: taUser.publicId },
      { publicId: offering.publicId },
    );
    assertEqual(result.outcome, "removed", "should deactivate TA");

    const role = await getMemberRole(
      { utorid: taUser.utorid },
      { publicId: offering.publicId },
    );
    assertEqual(role, null, "deactivated TA should lose active access");

    const row = (await prisma.offeringMember.findUnique({
      where: {
        userId_offeringId: {
          userId: taUser.id,
          offeringId: offering.id,
        },
      },
      select: offeringMemberRoleStatusSelect,
    })) as OfferingMemberRoleStatus | null;
    assertEqual(row?.role, "TA", "historical TA role should remain");
    assertEqual(
      row?.status,
      INACTIVE_OFFERING_MEMBER_STATUS,
      "status should be INACTIVE",
    );
  });

  // ── Test 21: listActiveTas returns only active TAs ────────────────────────
  await runTest("listActiveTas: returns only active TAs", async () => {
    const activeTa = await prisma.user.create({
      data: { utorid: `${TEST_PREFIX}list-active-ta` },
    });
    const inactiveTa = await prisma.user.create({
      data: { utorid: `${TEST_PREFIX}list-inactive-ta` },
    });

    await prisma.offeringMember.createMany({
      data: [
        offeringMemberRow({
          userId: activeTa.id,
          offeringId: offering.id,
          role: "TA",
        }),
        offeringMemberRow({
          userId: inactiveTa.id,
          offeringId: offering.id,
          role: "TA",
          status: INACTIVE_OFFERING_MEMBER_STATUS,
        }),
      ],
    });

    const tas = await listActiveTas({ publicId: offering.publicId });
    const utorids = tas.map((ta) => ta.utorid);
    assert(utorids.includes(activeTa.utorid), "active TA should be listed");
    assert(
      !utorids.includes(inactiveTa.utorid),
      "inactive TA should not be listed",
    );
  });

  // ── Test 22: addTaMember blocks active instructor ─────────────────────────
  await runTest("addTaMember: active instructor → blocked", async () => {
    const instructorUser = await prisma.user.create({
      data: { utorid: `${TEST_PREFIX}block-instructor` },
    });

    await prisma.offeringMember.create({
      data: offeringMemberRow({
        userId: instructorUser.id,
        offeringId: offering.id,
        role: "INSTRUCTOR",
      }),
    });

    const result = await addTaMember(
      { utorid: instructorUser.utorid },
      { publicId: offering.publicId },
    );
    assertEqual(result.outcome, "blocked", "should block instructor");
    if (result.outcome === "blocked") {
      assertEqual(result.reason, "instructor", "reason should be instructor");
    }

    const membership = await prisma.offeringMember.findUnique({
      where: {
        userId_offeringId: {
          userId: instructorUser.id,
          offeringId: offering.id,
        },
      },
      select: { role: true },
    });
    assertEqual(
      membership?.role,
      "INSTRUCTOR",
      "instructor role should remain",
    );
  });

  // ── Test 23: addTaMember blocks active student ──────────────────────────────
  await runTest("addTaMember: active student → blocked", async () => {
    const studentUser = await prisma.user.create({
      data: { utorid: `${TEST_PREFIX}block-student` },
    });

    await prisma.offeringMember.create({
      data: offeringMemberRow({
        userId: studentUser.id,
        offeringId: offering.id,
        role: "STUDENT",
      }),
    });

    const result = await addTaMember(
      { utorid: studentUser.utorid },
      { publicId: offering.publicId },
    );
    assertEqual(result.outcome, "blocked", "should block student");
    if (result.outcome === "blocked") {
      assertEqual(result.reason, "student", "reason should be student");
    }

    const membership = await prisma.offeringMember.findUnique({
      where: {
        userId_offeringId: {
          userId: studentUser.id,
          offeringId: offering.id,
        },
      },
      select: { role: true },
    });
    assertEqual(membership?.role, "STUDENT", "student role should remain");
  });

  // Cleanup
  await cleanupAll();
  await finishTests();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
