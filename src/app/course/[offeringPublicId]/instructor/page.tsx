import {
  OfferingAccessMessage,
  offeringAccessFromUnknown,
} from "@/app/components/instructor/OfferingAccessMessage";
import InstructorDashboard from "@/app/components/instructor/InstructorDashboard";
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

  return (
    <main>
      <InstructorDashboard
        offeringPublicId={pageContext.offeringPublicId}
        courseLabel={pageContext.courseLabel}
      />
    </main>
  );
}
