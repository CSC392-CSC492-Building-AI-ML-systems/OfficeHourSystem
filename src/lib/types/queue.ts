// DTO for a single upcoming office hour session shown on My Queue page
export type UpcomingSessionDto = {
  sessionPublicId: string;
  courseCode: string;
  title: string;
  startsAt: string; // ISO string
  endsAt: string; // ISO string
  location: string;
  status: "SCHEDULED" | "ACTIVE" | "DELAYED" | "COMPLETED" | "CANCELLED";
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
  | { outcome: "checked_in";      studentName: string }
  | { outcome: "already_in_queue"; studentName: string }
  | { outcome: "mock_user";        studentName: string }  // barcode dev mock
  | { outcome: "student_not_found" }
  | { outcome: "not_enrolled" }
  | { outcome: "session_not_active" };

// Full queue state returned when a TA opens a session
export type ActiveQueueDto = {
  sessionStatus: "SCHEDULED" | "ACTIVE" | "DELAYED" | "COMPLETED" | "CANCELLED";
  endsAt: string; // ISO string — used by the frontend auto-end timer
  waiting: WaitingStudentDto[];
  helping: HelpingStudentDto[];
};
