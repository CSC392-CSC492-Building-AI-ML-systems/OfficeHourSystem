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

// Full queue state returned when a TA opens a session
export type ActiveQueueDto = {
  waiting: WaitingStudentDto[];
  helping: HelpingStudentDto[];
};
