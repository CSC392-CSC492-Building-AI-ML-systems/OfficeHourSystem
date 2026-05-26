import { prisma } from "@/lib/prisma";

export const TEST_PREFIX = "__test__";
export const TEST_TERM = "__TEST_TERM__";

// Clean Up All Test Data

export async function cleanupAll(): Promise<void> {
  // 1. Delete leaf tables first (they have FKs pointing to session / user / offering)
  await prisma.officeHourInterest.deleteMany({
    where: {
      OR: [
        { user: { utorid: { startsWith: TEST_PREFIX } } },
        { session: { offering: { termCode: TEST_TERM } } },
      ],
    },
  });

  await prisma.officeHourAttendance.deleteMany({
    where: { session: { offering: { termCode: TEST_TERM } } },
  });

  await prisma.officeHourSessionHost.deleteMany({
    where: { session: { offering: { termCode: TEST_TERM } } },
  });

  // 2. Delete sessions (depend on offering and optionally on schedule)
  await prisma.officeHourSession.deleteMany({
    where: { offering: { termCode: TEST_TERM } },
  });

  // 3. Delete schedule-related records
  await prisma.officeHourScheduleHost.deleteMany({
    where: { schedule: { offering: { termCode: TEST_TERM } } },
  });

  await prisma.officeHourSchedule.deleteMany({
    where: { offering: { termCode: TEST_TERM } },
  });

  // 4. Delete offering members and the offering itself
  await prisma.offeringMember.deleteMany({
    where: {
      OR: [
        { offering: { termCode: TEST_TERM } },
        { user: { utorid: { startsWith: TEST_PREFIX } } },
      ],
    },
  });

  await prisma.courseOffering.deleteMany({
    where: { termCode: TEST_TERM },
  });

  // 5. Delete courses (those whose code starts with __test__)
  await prisma.course.deleteMany({
    where: { code: { startsWith: TEST_PREFIX } },
  });

  // 6. Finally delete users (those whose utorid starts with __test__)
  await prisma.user.deleteMany({
    where: { utorid: { startsWith: TEST_PREFIX } },
  });
}

// Assertion Utilities

export function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label} → expected ${String(expected)}, got ${String(actual)}`);
  }
}

// Test Runner

let passed = 0;
let failed = 0;

export async function runTest(
  name: string,
  fn: () => Promise<void>,
): Promise<void> {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}`);
    console.log(`    → ${(e as Error).message}`);
    failed++;
  }
}

/**
 * Call after all tests have run. Prints a summary and disconnects Prisma.
 * Exits with code 1 if any tests failed.
 */
export async function finishTests(): Promise<void> {
  await prisma.$disconnect();
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}
