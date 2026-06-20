import {
  OfferingAccessMessage,
  offeringAccessFromUnknown,
} from "@/app/components/instructor/OfferingAccessMessage";
import MyQueuesPage from "@/app/components/instructor/queues/MyQueuesPage";
import { resolveInstructorOfferingPage } from "@/lib/auth/instructorPage";

type PageProps = {
  params: Promise<{ offeringPublicId: string }>;
};

export default async function InstructorMyQueuesPage({ params }: PageProps) {
  const { offeringPublicId } = await params;

  let pageContext;
  try {
    pageContext = await resolveInstructorOfferingPage(
      offeringPublicId,
      `/course/${offeringPublicId}/instructor/my-queues`,
    );
  } catch (error) {
    return <OfferingAccessMessage error={offeringAccessFromUnknown(error)} />;
  }

  return (
    <main>
      <MyQueuesPage
        offeringPublicId={pageContext.offeringPublicId}
        courseLabel={pageContext.courseLabel}
      />
    </main>
  );
}
