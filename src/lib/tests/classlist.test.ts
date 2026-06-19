/**
 * Tests: importClasslist()
 *
 * How to run:
 *   pnpm dlx tsx tests/lib/classlist.test.ts
 *
 * Prerequisite: DATABASE_URL must be configured in .env or as an environment variable.
 *
 * Scenarios covered:
 *   1. Empty rows array → should throw, no data written
 *   2. Normal import    → course / offering / user / member all created, stats correct
 *   3. Current_sts is ignored → all rows are imported normally
 *   4. Row missing UTORid → throws, transaction rolls back (no partial data left)
 *   5. Row missing Person ID → throws, transaction rolls back
 *   6. Re-importing same offering → old students cleared and replaced with new CSV result
 */

// Must be the first import to ensure DATABASE_URL is injected before the prisma.ts module loads
import "dotenv/config";

import { prisma } from "@/lib/prisma";
import { importClasslist, type ClasslistRow } from "@/lib/queries/classlist";
import {
  TEST_PREFIX,
  TEST_TERM,
  cleanupAll,
  assert,
  assertEqual,
  runTest,
  finishTests,
} from "./_seed";

// Test Data Factory

function makeStudentNumber(suffix: string): string {
  const numericPart = Array.from(suffix).reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );

  return `101${String(numericPart).padStart(7, "0")}`;
}

/** Generate a valid student row */
function makeRow(
  suffix: string,
  overrides: Partial<ClasslistRow> = {},
): ClasslistRow {
  return {
    Acad_act: `${TEST_PREFIX}CSC392H5`,
    Email: `${TEST_PREFIX}${suffix}@mail.utoronto.ca`,
    Surname: "Test",
    "Given Name": suffix,
    "Person ID": makeStudentNumber(suffix),
    UTORid: `${TEST_PREFIX}${suffix}`,
    ...overrides,
  };
}

async function main() {
  console.log("=== classlist.test.ts ===\n");

  // Clean up before each run to prevent leftover dirty data from previous failures
  await cleanupAll();

  // Test 1: empty rows array should throw
  await runTest("Empty rows array → throws, no data written", async () => {
    let threw = false;
    try {
      await importClasslist({ termCode: TEST_TERM, rows: [] });
    } catch {
      threw = true;
    }
    assert(threw, "Should have thrown an error but did not");

    // Confirm no leftover data in the database
    const course = await prisma.course.findFirst({
      where: { code: { startsWith: TEST_PREFIX } },
    });
    assert(course === null, "No course should have been created");
  });

  // Test 2: normal import
  await runTest(
    "Normal import → course / offering / user / member all created",
    async () => {
      const rows = [makeRow("alice"), makeRow("bob"), makeRow("charlie")];
      const result = await importClasslist({ termCode: TEST_TERM, rows });

      // Verify returned stats
      assertEqual(result.imported, 3, "imported count");
      assertEqual(result.cleared, 0, "cleared should be 0 on first import");

      // Verify course was created
      const course = await prisma.course.findUnique({
        where: { code: `${TEST_PREFIX}CSC392H5` },
      });
      assert(course !== null, "course should have been created");

      // Verify offering was created
      const offering = await prisma.courseOffering.findFirst({
        where: { courseId: course!.id, termCode: TEST_TERM },
      });
      assert(offering !== null, "offering should have been created");

      // Verify all 3 users exist
      const userCount = await prisma.user.count({
        where: { utorid: { startsWith: TEST_PREFIX } },
      });
      assertEqual(userCount, 3, "user count");

      const alice = await prisma.user.findUnique({
        where: { studentNumber: makeStudentNumber("alice") },
      });
      assert(
        alice !== null,
        "student number should be stored for imported users",
      );

      // Verify all 3 STUDENT members exist
      const memberCount = await prisma.offeringMember.count({
        where: { offeringId: offering!.id, role: "STUDENT" },
      });
      assertEqual(memberCount, 3, "member count");
    },
  );

  // Test 3: Current_sts is ignored
  await runTest(
    "Current_sts is ignored and all rows are imported",
    async () => {
      // Clean up data from the previous test first
      await cleanupAll();

      const rows = [
        makeRow("active1", { Current_sts: "ENROLLED" }),
        makeRow("waitlisted", { Current_sts: "WL" }),
        makeRow("active2", { Current_sts: "" }),
        makeRow("dropped", { Current_sts: "DROP" }),
      ];

      const result = await importClasslist({ termCode: TEST_TERM, rows });

      assertEqual(result.imported, 4, "imported count");

      const wlUser = await prisma.user.findFirst({
        where: { utorid: `${TEST_PREFIX}waitlisted` },
      });
      assert(wlUser !== null, "waitlisted user should have been created");
    },
  );

  // Test 4: row missing UTORid → throws, transaction rolls back
  await runTest(
    "Row missing UTORid → throws, transaction fully rolled back",
    async () => {
      await cleanupAll();

      const rows = [
        makeRow("validuser"),
        makeRow("noid", { UTORid: "" }), // missing UTORid, should trigger an error
      ];

      let threw = false;
      try {
        await importClasslist({ termCode: TEST_TERM, rows });
      } catch {
        threw = true;
      }
      assert(threw, "Should have thrown an error");

      // After transaction rollback, validuser should not exist either
      const user = await prisma.user.findFirst({
        where: { utorid: `${TEST_PREFIX}validuser` },
      });
      assert(
        user === null,
        "validuser should not remain after transaction rollback",
      );
    },
  );

  // Test 5: row missing Person ID -> throws, transaction rolls back
  await runTest("Row missing Person ID rolls back transaction", async () => {
    await cleanupAll();

    const rows = [
      makeRow("validuser"),
      makeRow("nonumber", { "Person ID": "" }),
    ];

    let threw = false;
    try {
      await importClasslist({ termCode: TEST_TERM, rows });
    } catch {
      threw = true;
    }
    assert(threw, "Should have thrown an error");

    const user = await prisma.user.findFirst({
      where: { utorid: `${TEST_PREFIX}validuser` },
    });
    assert(
      user === null,
      "validuser should not remain after transaction rollback",
    );
  });

  // Test 6: re-importing same offering
  await runTest(
    "Re-import → old students cleared and replaced with new CSV result",
    async () => {
      await cleanupAll();

      // First import: alice + bob
      const firstRows = [makeRow("alice"), makeRow("bob")];
      const firstResult = await importClasslist({
        termCode: TEST_TERM,
        rows: firstRows,
      });
      assertEqual(firstResult.imported, 2, "first import: imported count");
      assertEqual(firstResult.cleared, 0, "first import: cleared should be 0");

      // Second import: bob + charlie (alice removed)
      const secondRows = [makeRow("bob"), makeRow("charlie")];
      const secondResult = await importClasslist({
        termCode: TEST_TERM,
        rows: secondRows,
      });
      assertEqual(secondResult.imported, 2, "second import: imported count");
      assertEqual(
        secondResult.cleared,
        2,
        "second import: cleared should be 2 (old alice + bob)",
      );

      // Confirm final STUDENT members are only bob and charlie
      const offering = await prisma.courseOffering.findFirst({
        where: { termCode: TEST_TERM },
      });
      const members = await prisma.offeringMember.findMany({
        where: { offeringId: offering!.id, role: "STUDENT" },
        include: { user: true },
      });
      assertEqual(members.length, 2, "final member count should be 2");

      const utorids = members.map((m) => m.user.utorid).sort();
      assert(utorids.includes(`${TEST_PREFIX}bob`), "bob should be in members");
      assert(
        utorids.includes(`${TEST_PREFIX}charlie`),
        "charlie should be in members",
      );
    },
  );

  // Cleanup
  await cleanupAll();
  await finishTests();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
