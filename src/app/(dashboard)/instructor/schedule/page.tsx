import {
  OfferingAccessMessage,
  offeringAccessFromUnknown,
} from "@/app/components/instructor/OfferingAccessMessage";
import InstructorScheduleDashboard from "@/app/components/instructor/schedule/InstructorScheduleDashboard";
import { resolveInstructorOfferingPage } from "@/lib/auth/instructorPage";
import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { getInstructorSchedulePage } from "@/lib/queries/officeHourScheduling";

type PageProps = {
  searchParams: Promise<{ offering?: string }>;
};

export default async function InstructorSchedulePage({
  searchParams,
}: PageProps) {
  const { offering } = await searchParams;

  let pageContext;
  try {
    pageContext = await resolveInstructorOfferingPage(
      offering,
      "/instructor/schedule",
    );
  } catch (error) {
    return <OfferingAccessMessage error={offeringAccessFromUnknown(error)} />;
  }

  const session = await getRequestSession();
  const userId = parseSessionUserId(session!);
  const initialData = await getInstructorSchedulePage(
    userId,
    pageContext.offeringPublicId,
  );

  return (
    <main>
      <InstructorScheduleDashboard
        initialData={initialData}
        offeringPublicId={pageContext.offeringPublicId}
        courseLabel={pageContext.courseLabel}
      />
    </main>
  );
}
