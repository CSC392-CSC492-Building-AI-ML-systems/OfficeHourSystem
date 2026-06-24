import { redirect } from "next/navigation";

import SessionStatsListPage from "@/app/components/instructor/stats/SessionStatsListPage";
import { getRequestSession } from "@/lib/auth/getRequestSession";
import { getOfferingSessionStatsService } from "@/services/course_stats/course-stats";
import type { OfferingSessionStats } from "@/services/course_stats/course-stats";

interface PageProps {
  searchParams: Promise<{ offering?: string }>;
}

export default async function SessionStatsRoute({ searchParams }: PageProps) {
  const session = await getRequestSession();
  if (!session) {
    redirect("/api/auth/session?redirect=/instructor/course-stats/overview");
  }

  // A course must be chosen first; otherwise go pick one.
  const { offering } = await searchParams;
  if (!offering) {
    redirect("/instructor/course-stats/overview");
  }

  // Service enforces INSTRUCTOR-of-this-offering; any failure → back to picker.
  let data: OfferingSessionStats;
  try {
    data = await getOfferingSessionStatsService(offering);
  } catch {
    redirect("/instructor/course-stats/overview");
  }

  return (
    <main>
      <SessionStatsListPage
        offeringPublicId={offering}
        courseCode={data.courseCode}
        termCode={data.termCode}
        initialSessions={data.sessions}
      />
    </main>
  );
}
