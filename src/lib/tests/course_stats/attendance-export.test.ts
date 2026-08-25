/**
 * Tests: serializeAttendanceExportCsv()
 *
 * How to run:
 *   npx tsx src/lib/tests/course_stats/attendance-export.test.ts
 */

import {
  ATTENDANCE_EXPORT_HEADERS,
  serializeAttendanceExportCsv,
} from "@/lib/csv/attendanceExport";
import type { AttendanceExportRow } from "@/lib/queries/course_stats/attendance-export";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`${label} → expected ${expected}, got ${actual}`);
  }
}

const sampleRow: AttendanceExportRow = {
  courseCode: "CSC108",
  termCode: "20261",
  sessionTitle: "Help Centre, Week 3",
  sessionStartsAt: "2026-01-15T15:00:00.000Z",
  sessionEndsAt: "2026-01-15T17:00:00.000Z",
  sessionLocation: "BA 2250",
  sessionHosts: "Alex Host; Sam TA",
  sessionStatus: "COMPLETED",
  studentName: "Jane Doe",
  studentNumber: "1001234567",
  studentUtorid: "janedoe",
  checkedInAt: "2026-01-15T15:05:00.000Z",
  helpStartedAt: "2026-01-15T15:20:00.000Z",
  helpEndedAt: "2026-01-15T15:35:00.000Z",
  helperName: "Sam TA",
  outcome: "COMPLETED",
  waitMinutes: "15",
  helpMinutes: "15",
};

assertEqual(
  serializeAttendanceExportCsv([]),
  `${ATTENDANCE_EXPORT_HEADERS.join(",")}\n`,
  "empty export",
);

const escapedCsv = serializeAttendanceExportCsv([
  {
    ...sampleRow,
    sessionTitle: 'Help Centre, "Week 3"',
    sessionHosts: 'Alex "Coach" Host',
  },
]);
const escapedLines = escapedCsv.trimEnd().split("\n");
assertEqual(escapedLines.length, 2, "header + one row");
assert(
  escapedLines[1].includes('"Help Centre, ""Week 3"""'),
  "session title escaped",
);
assert(
  escapedLines[1].includes('"Alex ""Coach"" Host"'),
  "session hosts escaped",
);

const csv = serializeAttendanceExportCsv([sampleRow]);
const lines = csv.trimEnd().split("\n");
assertEqual(lines[0], ATTENDANCE_EXPORT_HEADERS.join(","), "header");
assert(lines[1].includes("CSC108"), "course code present");
assert(lines[1].includes("janedoe"), "utorid present");
assert(lines[1].endsWith("15"), "help minutes present");

console.log("All attendance-export tests passed.");
