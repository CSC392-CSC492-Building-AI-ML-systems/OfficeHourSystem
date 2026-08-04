import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { getUpcomingSessionsForStudent } from "@/lib/queries/student_dashboard/student-dashboard";

export type StudentDashboardSessionDto = {
  sessionId: number;
  sessionPublicId: string;
  type: "REGULAR" | "DEBUGGING" | "GROUP";
  title: string;
  location: string;
  startsAt: string;
  endsAt: string;
  status: string;
  courseCode: string;
  isInterested: boolean;
};

export async function getStudentDashboardService(
  offeringPublicId: string,
): Promise<StudentDashboardSessionDto[]> {
  const session = await getRequestSession();
  if (!session) throw new Error("Unauthorized");
  const userId = parseSessionUserId(session);

  const sessions = await getUpcomingSessionsForStudent(
    userId,
    offeringPublicId,
  );

  return sessions.map((s) => ({
    sessionId: s.id,
    sessionPublicId: s.publicId,
    type: s.type as "REGULAR" | "DEBUGGING" | "GROUP",
    title: s.title,
    location: s.location ?? "TBD",
    startsAt: s.startsAt.toISOString(),
    endsAt: s.endsAt.toISOString(),
    status: s.status,
    courseCode: s.offering.course.code,
    isInterested: s.interests.length > 0,
  }));
}
