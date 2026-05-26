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
  await runTest("getMemberRole: query by utorid → returns correct role", async () => {
    const result = await getMemberRole(
      { utorid: user.utorid },
      { publicId: offering.publicId },
    );
    assert(result !== null, "should not return null");
    assertEqual(result!.role, "INSTRUCTOR", "role should be INSTRUCTOR");
  });

  // ── Test 5: query by email ────────────────────────────────────────────────
  await runTest("getMemberRole: query by email → returns correct role", async () => {
    const result = await getMemberRole(
      { email: user.email },
      { publicId: offering.publicId },
    );
    assert(result !== null, "should not return null");
    assertEqual(result!.role, "INSTRUCTOR", "role should be INSTRUCTOR");
  });

  // ── Test 6: query by user publicId ───────────────────────────────────────
  await runTest("getMemberRole: query by user publicId → returns correct role", async () => {
    const result = await getMemberRole(
      { publicId: user.publicId },
      { publicId: offering.publicId },
    );
    assert(result !== null, "should not return null");
    assertEqual(result!.role, "INSTRUCTOR", "role should be INSTRUCTOR");
  });

  // ── Test 7: query by offering publicId ───────────────────────────────────
  await runTest("getMemberRole: query by offering publicId → returns correct role", async () => {
    const result = await getMemberRole(
      { utorid: user.utorid },
      { publicId: offering.publicId },
    );
    assert(result !== null, "should not return null");
    assertEqual(result!.role, "INSTRUCTOR", "role should be INSTRUCTOR");
  });

  // ── Test 8: query by courseCode + termCode ───────────────────────────────
  await runTest("getMemberRole: query by courseCode + termCode → returns correct role", async () => {
    const result = await getMemberRole(
      { utorid: user.utorid },
      { courseCode: course.code, termCode: TEST_TERM },
    );
    assert(result !== null, "should not return null");
    assertEqual(result!.role, "INSTRUCTOR", "role should be INSTRUCTOR");
  });

  // ── Test 9: attempt to set STUDENT role → throws (safety check) ──────────
  await runTest("addOrUpdateStaffMember: set STUDENT role → throws", async () => {
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
  });

  // ── Test 10: user does not exist → throws ────────────────────────────────
  await runTest("addOrUpdateStaffMember: user does not exist → throws", async () => {
    let errorMsg = "";
    try {
      await addOrUpdateStaffMember(
        { utorid: `${TEST_PREFIX}nobody` },
        { publicId: offering.publicId },
        "TA",
      );
    } catch (e) {
      errorMsg = (e as Error).message;
    }
    assert(errorMsg.includes("User not found"), `Should contain 'User not found', got: ${errorMsg}`);
  });

  // ── Test 11: offering does not exist → throws ─────────────────────────────
  await runTest("addOrUpdateStaffMember: Offering does not exist → throws", async () => {
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
  });

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
  await runTest("addOrUpdateStaffMember: add INSTRUCTOR → created=true", async () => {
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
    assertEqual(check?.role, "INSTRUCTOR", "getMemberRole should return INSTRUCTOR");
  });

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

  // ── Test 14: add ADMIN ────────────────────────────────────────────────────
  await runTest("addOrUpdateStaffMember: add ADMIN → created=true", async () => {
    const adminUser = await prisma.user.create({
      data: {
        utorid: `${TEST_PREFIX}adminuser`,
        email: `${TEST_PREFIX}adminuser@mail.utoronto.ca`,
        firstName: "Admin",
        lastName: "User",
      },
    });
    const result = await addOrUpdateStaffMember(
      { utorid: adminUser.utorid },
      { publicId: offering.publicId },
      "ADMIN",
    );
    assertEqual(result.role, "ADMIN", "role should be ADMIN");
    assertEqual(result.created, true, "should be newly created");
  });

  // ── Test 15: update existing member role (TA → INSTRUCTOR) → created=false ─
  await runTest("addOrUpdateStaffMember: TA → INSTRUCTOR → created=false, role updated", async () => {
    // freshUser is currently INSTRUCTOR (set in test 12), change to TA then back
    const toTA = await addOrUpdateStaffMember(
      { utorid: freshUser.utorid },
      { publicId: offering.publicId },
      "TA",
    );
    assertEqual(toTA.role, "TA", "should be updated to TA");
    assertEqual(toTA.created, false, "should be an update (not a new creation)");

    const back = await addOrUpdateStaffMember(
      { utorid: freshUser.utorid },
      { publicId: offering.publicId },
      "INSTRUCTOR",
    );
    assertEqual(back.role, "INSTRUCTOR", "should be updated back to INSTRUCTOR");
    assertEqual(back.created, false, "should be an update (not a new creation)");
  });

  // ── Test 16: user is STUDENT, can be promoted to TA ─────────────────────
  await runTest("addOrUpdateStaffMember: STUDENT can be promoted to TA (upgrade flow)", async () => {
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
      data: { userId: studentUser.id, offeringId: offering.id, role: "STUDENT" },
    });

    // Confirm current role is STUDENT
    const before = await getMemberRole(
      { utorid: studentUser.utorid },
      { publicId: offering.publicId },
    );
    assertEqual(before?.role, "STUDENT", "role should be STUDENT before promotion");

    // Promote to TA
    const result = await addOrUpdateStaffMember(
      { utorid: studentUser.utorid },
      { publicId: offering.publicId },
      "TA",
    );
    assertEqual(result.role, "TA", "role should be TA after promotion");
    assertEqual(result.created, false, "should be an update (not a new creation)");

    // Confirm with getMemberRole again
    const after = await getMemberRole(
      { utorid: studentUser.utorid },
      { publicId: offering.publicId },
    );
    assertEqual(after?.role, "TA", "getMemberRole should return TA");
  });

  // Cleanup
  await cleanupAll();
  await finishTests();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
