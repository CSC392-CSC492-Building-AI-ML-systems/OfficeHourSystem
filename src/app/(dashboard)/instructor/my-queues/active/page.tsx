import { Suspense } from "react";
import { redirect } from "next/navigation";

import ActiveQueuePage from "@/app/components/instructor/queues/ActiveQueuePage";
import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { prisma } from "@/lib/prisma";

interface PageProps {
  searchParams: Promise<{ sessionId?: string }>;
}

export default async function InstructorActiveQueueRoute({
  searchParams,
}: PageProps) {
  const session = await getRequestSession();
  if (!session) {
    redirect("/api/auth/session?redirect=/instructor/my-queues/active");
  }

  // If a session is targeted, require TA/INSTRUCTOR membership in ITS offering.
  const { sessionId } = await searchParams;
  if (sessionId) {
    const userId = parseSessionUserId(session);
    const ohSession = await prisma.officeHourSession.findUnique({
      where: { publicId: sessionId },
      select: { offeringId: true },
    });
    if (!ohSession) {
      redirect("/instructor/my-queues");
    }
    const member = await prisma.offeringMember.findUnique({
      where: {
        userId_offeringId: { userId, offeringId: ohSession.offeringId },
      },
      select: { role: true },
    });
    if (!member || member.role === "STUDENT") {
      redirect("/student");
    }
  }

  return (
    <main>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#f4f7fb]" aria-hidden="true" />
        }
      >
        <ActiveQueuePage />
      </Suspense>
    </main>
  );
}
