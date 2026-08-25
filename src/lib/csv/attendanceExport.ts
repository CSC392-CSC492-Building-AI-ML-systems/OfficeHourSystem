import type { AttendanceExportRow } from "@/lib/queries/course_stats/attendance-export";

export const ATTENDANCE_EXPORT_HEADERS = [
  "course_code",
  "term_code",
  "session_title",
  "session_starts_at",
  "session_ends_at",
  "session_location",
  "session_hosts",
  "session_status",
  "student_name",
  "student_number",
  "student_utorid",
  "checked_in_at",
  "help_started_at",
  "help_ended_at",
  "helper_name",
  "outcome",
  "wait_minutes",
  "help_minutes",
] as const;

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function rowToCsvLine(row: AttendanceExportRow): string {
  const values = [
    row.courseCode,
    row.termCode,
    row.sessionTitle,
    row.sessionStartsAt,
    row.sessionEndsAt,
    row.sessionLocation,
    row.sessionHosts,
    row.sessionStatus,
    row.studentName,
    row.studentNumber,
    row.studentUtorid,
    row.checkedInAt,
    row.helpStartedAt,
    row.helpEndedAt,
    row.helperName,
    row.outcome,
    row.waitMinutes,
    row.helpMinutes,
  ];
  return values.map(escapeCsvField).join(",");
}

export function serializeAttendanceExportCsv(
  rows: AttendanceExportRow[],
): string {
  const header = ATTENDANCE_EXPORT_HEADERS.join(",");
  if (rows.length === 0) return `${header}\n`;
  return `${header}\n${rows.map(rowToCsvLine).join("\n")}\n`;
}
