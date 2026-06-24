import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { getTodaySessionsForStudent } from "@/lib/queries/student_dashboard/student-dashboard";

export type StudentDashboardSessionDto = {
  sessionPublicId: string;
  type: "REGULAR" | "DEBUGGING" | "GROUP";
  title: string;
  location: string;
  startsAt: string;
  endsAt: string;
  status: string;
  courseCode: string;
};

export async function getStudentDashboardService(): Promise<
  StudentDashboardSessionDto[]
> {
  const session = await getRequestSession();
  if (!session) throw new Error("Unauthorized");
  const userId = parseSessionUserId(session);

  const sessions = await getTodaySessionsForStudent(userId);

  return sessions.map((s) => ({
    sessionPublicId: s.publicId,
    type: s.type as "REGULAR" | "DEBUGGING" | "GROUP",
    title: s.title,
    location: s.location ?? "TBD",
    startsAt: s.startsAt.toISOString(),
    endsAt: s.endsAt.toISOString(),
    status: s.status,
    courseCode: s.offering.course.code,
  }));
}
