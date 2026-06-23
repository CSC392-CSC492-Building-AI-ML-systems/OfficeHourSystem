// DTO for a single upcoming office hour session shown on My Queue page
export type UpcomingSessionDto = {
  sessionPublicId: string;
  courseCode: string;
  title: string;
  startsAt: string; // ISO string
  endsAt: string; // ISO string
  location: string;
  status: "SCHEDULED" | "ACTIVE" | "DELAYED" | "COMPLETED" | "CANCELLED";
  interestedCount: number; // students who marked interest in this session
};

// A student waiting in the queue (has a rank based on check-in time)
export type WaitingStudentDto = {
  attendancePublicId: string;
  studentPublicId: string;
  studentName: string;
  rank: number; // 1 = first in line
};

// A student currently being helped (no rank)
export type HelpingStudentDto = {
  attendancePublicId: string;
  studentPublicId: string;
  studentName: string;
};

// Identifier types the scan page can receive
export type IdentifierType = "student_number" | "utorid" | "barcode";

// Result of a scan check-in attempt
export type ScanCheckInResult =
  | { outcome: "checked_in"; studentName: string }
  | { outcome: "already_in_queue"; studentName: string }
  | { outcome: "mock_user"; studentName: string } // barcode dev mock
  | { outcome: "student_not_found" }
  | { outcome: "not_enrolled" }
  | { outcome: "session_not_active" };

// A student's active queue ticket (shown on student My Queue page)
export type StudentQueueTicketDto = {
  attendancePublicId: string;
  sessionPublicId: string;
  courseCode: string;
  sessionTitle: string;
  location: string;
  startsAt: string;
  endsAt: string;
  status: "WAITING" | "IN_HELP";
  position: number; // 1 = next up; 0 = currently being helped
  checkedInAt: string;
  waitedMinutes: number;
  estimatedWaitMinutes: number | null;
  estimatedWaitMargin: number | null; // ±margin at 85% prediction interval
};

// Full queue state returned when a TA opens a session
export type ActiveQueueDto = {
  sessionStatus: "SCHEDULED" | "ACTIVE" | "DELAYED" | "COMPLETED" | "CANCELLED";
  endsAt: string; // ISO string — used by the frontend auto-end timer
  courseCode: string;
  title: string;
  lastCheckInName: string | null; // most recent check-in, null if queue empty
  waiting: WaitingStudentDto[];
  helping: HelpingStudentDto[];
};

// Shared session status union
export type SessionStatus =
  | "SCHEDULED"
  | "ACTIVE"
  | "DELAYED"
  | "COMPLETED"
  | "CANCELLED";

// ── My Course Stats (INSTRUCTOR-only analytics) ────────────────────────────

// One DEBUGGING session's aggregate stats, shown as a card on the overview page.
// Attendance metrics are null (rendered as "NA") for sessions that haven't run yet.
export type CourseStatsSessionDto = {
  sessionPublicId: string;
  courseCode: string;
  title: string;
  startsAt: string; // ISO string
  endsAt: string; // ISO string
  location: string;
  status: SessionStatus;
  hostNames: string[]; // a session may have multiple hosts
  checkedIn: number | null; // distinct students who checked in
  gotHelp: number | null; // distinct students who were helped
  interested: number | null; // students who marked interest
  interestedShowed: number | null; // interested students who actually attended
};

// One visit (a student can have several within the same session).
export type SessionVisitDto = {
  helperName: string | null; // who helped this visit; null → NA
  helpMinutes: number | null; // help duration; null → NA
  waitMinutes: number | null; // time spent waiting; null → NA
  outcome: "COMPLETED" | "NO_SHOW" | "CANCELLED";
};

// One student's rolled-up stats for a session (students are NOT unique — a
// student may queue multiple times, so visits[] holds each occurrence).
export type SessionStatsStudentDto = {
  studentName: string;
  studentNumber: string | null; // null → NA
  visitCount: number;
  totalHelpMinutes: number;
  totalWaitMinutes: number;
  visits: SessionVisitDto[];
};

// Full drill-down detail for a single session, students pre-sorted by
// total help time → visit count → total wait time (all descending).
export type SessionStatsDetailDto = {
  sessionPublicId: string;
  offeringPublicId: string; // for the "back to per-session data" link
  courseCode: string;
  title: string;
  startsAt: string; // ISO string
  endsAt: string; // ISO string
  location: string;
  status: SessionStatus;
  hostNames: string[];
  students: SessionStatsStudentDto[];
};

// ── Course-level overview (whole offering, all sessions aggregated) ─────────

// One offering the instructor can pick on the course-overview entry page.
export type InstructorOfferingDto = {
  offeringPublicId: string;
  courseCode: string;
  termCode: string;
};

// Aggregate stats for one offering. ENDED (COMPLETED) sessions only for the
// attendance-based metrics; interest spans the whole offering; ratios are over
// enrolled student count. Anything that can't be computed is null ("NA").
export type CourseOverviewDto = {
  offeringPublicId: string;
  courseCode: string;
  termCode: string;
  totalStudents: number; // enrolled students (ratio denominator)
  endedSessionCount: number; // COMPLETED sessions (per-session denominator)
  // Course totals
  studentsHelped: number; // distinct, ENDED sessions
  helpedRatio: number | null; // studentsHelped / totalStudents
  interestRecords: number; // total interest rows (whole offering)
  studentsInterested: number; // distinct interested users (whole offering)
  interestedRatio: number | null; // studentsInterested / totalStudents
  studentsCheckedIn: number; // distinct, ENDED sessions, any outcome
  interestedShowedRatio: number | null; // ENDED: came / interested
  avgHelpMinutes: number | null; // ENDED sessions
  // Per-ENDED-session averages (distinct people per session, averaged)
  avgHelpedPerSession: number | null;
  avgInterestedPerSession: number | null;
  avgCheckInsPerSession: number | null;
};

// One visit within the offering (includes which session it was).
export type CourseVisitDto = {
  sessionTitle: string;
  helperName: string | null;
  helpMinutes: number | null;
  waitMinutes: number | null;
  outcome: "COMPLETED" | "NO_SHOW" | "CANCELLED";
};

// One student's stats across the whole offering. Sorted by visit count →
// helped count → total help minutes (all descending).
export type CourseStudentDetailDto = {
  studentName: string;
  studentNumber: string | null;
  visitCount: number;
  helpedCount: number;
  totalHelpMinutes: number;
  totalWaitMinutes: number;
  visits: CourseVisitDto[];
};
