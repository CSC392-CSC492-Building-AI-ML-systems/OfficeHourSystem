import {
  OfferingAccessMessage,
  offeringAccessFromUnknown,
} from "@/app/components/instructor/OfferingAccessMessage";
import StudentDashboard from "@/app/components/student/StudentDashboard";
import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { resolveStudentOfferingPage } from "@/lib/auth/studentPage";
import { prisma } from "@/lib/prisma";
import { listScheduleWeek } from "@/lib/queries/officeHourScheduling";
import { getStudentDashboardService } from "@/services/student_dashboard/student-dashboard";

type PageProps = {
  params: Promise<{ offeringPublicId: string }>;
};

export default async function StudentPage({ params }: PageProps) {
  const { offeringPublicId } = await params;

  let pageContext;
  try {
    pageContext = await resolveStudentOfferingPage(
      offeringPublicId,
      `/course/${offeringPublicId}/student`,
    );
  } catch (error) {
    return (
      <OfferingAccessMessage
        error={offeringAccessFromUnknown(error)}
        backHref="/"
        backLabel="Return home"
      />
    );
  }

  const session = await getRequestSession();
  const userId = parseSessionUserId(session!);
  const [sessions, week, user] = await Promise.all([
    getStudentDashboardService(offeringPublicId),
    listScheduleWeek(userId, offeringPublicId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { publicId: true },
    }),
  ]);

  return (
    <main>
      <StudentDashboard
        firstName={pageContext.firstName}
        sessions={sessions}
        courseLabel={pageContext.courseLabel}
        offeringPublicId={offeringPublicId}
        currentUserPublicId={user?.publicId ?? null}
        initialWeek={{
          weekStart: week.weekStart,
          weekLabel: week.weekLabel,
          calendarDays: week.calendarDays,
          sessions: week.sessions,
        }}
      />
    </main>
  );
}
