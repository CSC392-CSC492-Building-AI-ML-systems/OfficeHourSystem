import { Suspense } from "react";

import {
  OfferingAccessMessage,
  offeringAccessFromUnknown,
} from "@/app/components/instructor/OfferingAccessMessage";
import { ScanPage } from "@/app/components/instructor/scan/ScanPage";
import { resolveInstructorOfferingPage } from "@/lib/auth/instructorPage";

type PageProps = {
  searchParams: Promise<{ offering?: string; sessionId?: string }>;
};

export default async function ScanRoute({ searchParams }: PageProps) {
  const { offering, sessionId } = await searchParams;

  if (!sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">
        <p className="text-sm text-slate-500">Missing session ID.</p>
      </div>
    );
  }

  let pageContext;
  try {
    await resolveInstructorOfferingPage(offering, "/instructor/scan");
  } catch (error) {
    return <OfferingAccessMessage error={offeringAccessFromUnknown(error)} />;
  }

  return (
    <Suspense>
      <ScanPage sessionPublicId={sessionId} />
    </Suspense>
  );
}
