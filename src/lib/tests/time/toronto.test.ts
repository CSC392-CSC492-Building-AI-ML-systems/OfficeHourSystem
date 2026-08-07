import { getTorontoTodayRange } from "@/lib/time/toronto";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  PASS ${name}`);
    passed++;
  } catch (error) {
    console.log(`  FAIL ${name}`);
    console.log(`    ${(error as Error).message}`);
    failed++;
  }
}

function expectEqual(actual: string, expected: string): void {
  if (actual !== expected) {
    throw new Error(`expected ${expected}, got ${actual}`);
  }
}

console.log("=== toronto.test.ts ===\n");

test("keeps an evening EDT session in the Toronto day after UTC midnight", () => {
  const { start, end } = getTorontoTodayRange(
    new Date("2026-08-07T01:05:00.000Z"),
  );

  expectEqual(start.toISOString(), "2026-08-06T04:00:00.000Z");
  expectEqual(end.toISOString(), "2026-08-07T03:59:59.999Z");
});

test("uses the winter UTC offset for Toronto midnight", () => {
  const { start, end } = getTorontoTodayRange(
    new Date("2026-01-07T01:05:00.000Z"),
  );

  expectEqual(start.toISOString(), "2026-01-06T05:00:00.000Z");
  expectEqual(end.toISOString(), "2026-01-07T04:59:59.999Z");
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exitCode = failed === 0 ? 0 : 1;
