import { redirect } from "next/navigation";

import SessionStatsListPage from "@/app/components/instructor/stats/SessionStatsListPage";
import { getRequestSession } from "@/lib/auth/getRequestSession";
import { getOfferingSessionStatsService } from "@/services/course_stats/course-stats";
import type { OfferingSessionStats } from "@/services/course_stats/course-stats";

type PageProps = {
  searchParams: Promise<{ offering?: string }>;
};

export default async function CourseSessionStatsRoute({
  searchParams,
}: PageProps) {
  const session = await getRequestSession();
  if (!session) {
    redirect("/api/auth/session?redirect=/course/stats");
  }

  const { offering } = await searchParams;
  if (!offering) {
    redirect("/course/stats");
  }

  let data: OfferingSessionStats;
  try {
    data = await getOfferingSessionStatsService(offering);
  } catch {
    redirect("/course/stats");
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
