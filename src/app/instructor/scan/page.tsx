import { Suspense } from "react";
import { redirect } from "next/navigation";

import { ScanPage } from "@/app/components/instructor/scan/ScanPage";
import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { prisma } from "@/lib/prisma";

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

  // Only TAs/instructors of this session's offering may open the scanner.
  const session = await getRequestSession();
  if (!session) {
    redirect(
      `/api/auth/session?redirect=/instructor/scan?sessionId=${sessionId}`,
    );
  }
  const userId = parseSessionUserId(session);
  const ohSession = await prisma.officeHourSession.findUnique({
    where: { publicId: sessionId },
    select: { offeringId: true },
  });
  if (!ohSession) {
    redirect("/instructor/my-queues");
  }
  const member = await prisma.offeringMember.findUnique({
    where: { userId_offeringId: { userId, offeringId: ohSession.offeringId } },
    select: { role: true },
  });
  if (!member || member.role === "STUDENT") {
    redirect("/student");
  }

  return (
    <Suspense>
      <ScanPage sessionPublicId={sessionId} />
    </Suspense>
  );
}
