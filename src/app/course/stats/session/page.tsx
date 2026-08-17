import { redirect } from "next/navigation";

import SessionStatsDetailPage from "@/app/components/instructor/stats/SessionStatsDetailPage";
import { getRequestSession } from "@/lib/auth/getRequestSession";
import { getSessionStatsDetailService } from "@/services/course_stats/session-detail";
import type { SessionStatsDetailDto } from "@/lib/types/queue";

type PageProps = {
  searchParams: Promise<{ session?: string }>;
};

export default async function CourseSessionStatsDetailRoute({
  searchParams,
}: PageProps) {
  const { session: sessionPublicId } = await searchParams;
  if (!sessionPublicId) {
    redirect("/course/stats");
  }

  const authSession = await getRequestSession();
  if (!authSession) {
    redirect(
      `/api/auth/session?redirect=${encodeURIComponent(`/course/stats/session?session=${sessionPublicId}`)}`,
    );
  }

  let detail: SessionStatsDetailDto;
  try {
    detail = await getSessionStatsDetailService(sessionPublicId);
  } catch {
    redirect("/course/stats");
  }

  return (
    <main>
      <SessionStatsDetailPage initialDetail={detail} />
    </main>
  );
}
