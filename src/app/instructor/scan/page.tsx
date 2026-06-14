import { Suspense } from "react";
import { ScanPage } from "@/app/components/instructor/scan/ScanPage";

interface PageProps {
  searchParams: Promise<{ sessionId?: string }>;
}

export default async function ScanRoute({ searchParams }: PageProps) {
  const { sessionId } = await searchParams;

  if (!sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">
        <p className="text-sm text-slate-500">Missing session ID.</p>
      </div>
    );
  }

  return (
    <Suspense>
      <ScanPage sessionPublicId={sessionId} />
    </Suspense>
  );
}
