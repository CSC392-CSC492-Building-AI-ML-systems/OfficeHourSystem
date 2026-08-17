import {
  OfferingAccessMessage,
  offeringAccessFromUnknown,
} from "@/app/components/instructor/OfferingAccessMessage";
import InstructorDashboard from "@/app/components/instructor/InstructorDashboard";
import { getInstructorStaffPageData } from "@/actions/instructor/staff";
import { resolveInstructorOfferingPage } from "@/lib/auth/instructorPage";

type PageProps = {
  params: Promise<{ offeringPublicId: string }>;
};

export default async function InstructorPage({ params }: PageProps) {
  const { offeringPublicId } = await params;

  let pageContext;
  try {
    pageContext = await resolveInstructorOfferingPage(
      offeringPublicId,
      `/course/${offeringPublicId}/instructor`,
    );
  } catch (error) {
    return <OfferingAccessMessage error={offeringAccessFromUnknown(error)} />;
  }

  const { staff, students } = await getInstructorStaffPageData(
    pageContext.offeringPublicId,
  );

  return (
    <main>
      <InstructorDashboard
        offeringPublicId={pageContext.offeringPublicId}
        courseLabel={pageContext.courseLabel}
        canEdit={pageContext.canEdit}
        initialStaff={staff}
        initialStudents={students}
      />
    </main>
  );
}
