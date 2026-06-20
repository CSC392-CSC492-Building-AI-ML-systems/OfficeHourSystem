import { Suspense } from "react";

import {
  OfferingAccessMessage,
  offeringAccessFromUnknown,
} from "@/app/components/instructor/OfferingAccessMessage";
import ActiveQueuePage from "@/app/components/instructor/queues/ActiveQueuePage";
import { resolveInstructorOfferingPage } from "@/lib/auth/instructorPage";

type PageProps = {
  params: Promise<{ offeringPublicId: string }>;
  searchParams: Promise<{ sessionId?: string }>;
};

export default async function InstructorActiveQueueRoute({
  params,
  searchParams,
}: PageProps) {
  const { offeringPublicId } = await params;
  const { sessionId } = await searchParams;

  let pageContext;
  try {
    pageContext = await resolveInstructorOfferingPage(
      offeringPublicId,
      `/course/${offeringPublicId}/instructor/my-queues/active`,
    );
  } catch (error) {
    return <OfferingAccessMessage error={offeringAccessFromUnknown(error)} />;
  }

  return (
    <main>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#f4f7fb]" aria-hidden="true" />
        }
      >
        <ActiveQueuePage
          offeringPublicId={pageContext.offeringPublicId}
          courseLabel={pageContext.courseLabel}
          sessionId={sessionId}
        />
      </Suspense>
    </main>
  );
}
