import {
  OfferingAccessMessage,
  offeringAccessFromUnknown,
} from "@/app/components/instructor/OfferingAccessMessage";
import StudentDashboard from "@/app/components/student/StudentDashboard";
import { resolveStudentOfferingPage } from "@/lib/auth/studentPage";
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

  const sessions = await getStudentDashboardService(offeringPublicId);

  return (
    <main>
      <StudentDashboard
        firstName={pageContext.firstName}
        sessions={sessions}
        courseLabel={pageContext.courseLabel}
      />
    </main>
  );
}
