import {
  OfferingAccessMessage,
  offeringAccessFromUnknown,
} from "@/app/components/instructor/OfferingAccessMessage";
import StudentDashboard from "@/app/components/student/StudentDashboard";
import { resolveStudentOfferingPage } from "@/lib/auth/studentPage";

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

  return (
    <main>
      <StudentDashboard
        offeringPublicId={pageContext.offeringPublicId}
        courseLabel={pageContext.courseLabel}
        firstName={pageContext.firstName}
      />
    </main>
  );
}
