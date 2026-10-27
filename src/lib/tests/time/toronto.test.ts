import {
  addDays,
  combineDateAndMinutes,
  datesForDayOfWeek,
  endOfLocalDay,
  formatDateOnlyLocal,
  formatDateTimeLabel,
  parseIsoDateOnly,
  startOfWeekMonday,
} from "@/lib/scheduling/time";
import { getTorontoTodayRange, torontoDateTime } from "@/lib/time/toronto";

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

test("torontoDateTime uses EDT in summer and EST in winter", () => {
  expectEqual(
    torontoDateTime(2026, 9, 28, 14).toISOString(),
    "2026-09-28T18:00:00.000Z",
  );
  expectEqual(
    torontoDateTime(2026, 12, 7, 14).toISOString(),
    "2026-12-07T19:00:00.000Z",
  );
});

test("torontoDateTime handles the DST switch days", () => {
  // Nov 1 2026: clocks fall back at 2 AM. Mar 8 2026: spring forward at 2 AM.
  expectEqual(
    torontoDateTime(2026, 11, 1).toISOString(),
    "2026-11-01T04:00:00.000Z",
  );
  expectEqual(
    torontoDateTime(2026, 11, 1, 12).toISOString(),
    "2026-11-01T17:00:00.000Z",
  );
  expectEqual(
    torontoDateTime(2026, 3, 8, 12).toISOString(),
    "2026-03-08T16:00:00.000Z",
  );
});

test("a 2-4 PM session is stored and read back as 2-4 PM Toronto", () => {
  const day = parseIsoDateOnly("2026-09-28");
  const startsAt = combineDateAndMinutes(day, 14 * 60);
  const endsAt = combineDateAndMinutes(day, 16 * 60);
  expectEqual(startsAt.toISOString(), "2026-09-28T18:00:00.000Z");
  expectEqual(
    `${formatDateTimeLabel(startsAt)} - ${formatDateTimeLabel(endsAt)}`,
    "2:00 PM - 4:00 PM",
  );
  expectEqual(formatDateOnlyLocal(startsAt), "2026-09-28");
});

test("weekly occurrences keep the wall-clock time across the fall-back", () => {
  const days = datesForDayOfWeek(
    1,
    parseIsoDateOnly("2026-10-26"),
    parseIsoDateOnly("2026-11-02"),
  );
  expectEqual(
    days.map((d) => combineDateAndMinutes(d, 10 * 60).toISOString()).join(),
    "2026-10-26T14:00:00.000Z,2026-11-02T15:00:00.000Z",
  );
});

test("addDays and week helpers stay on Toronto calendar dates", () => {
  const monday = startOfWeekMonday(new Date("2026-11-04T03:30:00.000Z")); // Tue Nov 3, 10:30 PM
  expectEqual(formatDateOnlyLocal(monday), "2026-11-02");
  expectEqual(formatDateOnlyLocal(addDays(monday, -7)), "2026-10-26");
  expectEqual(endOfLocalDay(monday).toISOString(), "2026-11-03T04:59:59.999Z");
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exitCode = failed === 0 ? 0 : 1;
