import {
  OfferingAccessMessage,
  offeringAccessFromUnknown,
} from "@/app/components/instructor/OfferingAccessMessage";
import InstructorDashboard from "@/app/components/instructor/InstructorDashboard";
import { resolveInstructorOfferingPage } from "@/lib/auth/instructorPage";

type PageProps = {
  searchParams: Promise<{ offering?: string }>;
};

export default async function InstructorPage({ searchParams }: PageProps) {
  const { offering } = await searchParams;

  let pageContext;
  try {
    pageContext = await resolveInstructorOfferingPage(offering, "/instructor");
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
