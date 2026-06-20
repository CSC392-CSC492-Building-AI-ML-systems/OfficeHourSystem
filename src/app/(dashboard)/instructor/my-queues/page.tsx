import {
  OfferingAccessMessage,
  offeringAccessFromUnknown,
} from "@/app/components/instructor/OfferingAccessMessage";
import MyQueuesPage from "@/app/components/instructor/queues/MyQueuesPage";
import { resolveInstructorOfferingPage } from "@/lib/auth/instructorPage";

type PageProps = {
  searchParams: Promise<{ offering?: string }>;
};

export default async function InstructorMyQueuesPage({
  searchParams,
}: PageProps) {
  const { offering } = await searchParams;

  let pageContext;
  try {
    pageContext = await resolveInstructorOfferingPage(
      offering,
      "/instructor/my-queues",
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
