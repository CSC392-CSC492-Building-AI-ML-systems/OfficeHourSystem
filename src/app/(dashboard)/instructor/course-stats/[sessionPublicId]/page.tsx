import { redirect } from "next/navigation";

import SessionStatsDetailPage from "@/app/components/instructor/stats/SessionStatsDetailPage";
import { getRequestSession } from "@/lib/auth/getRequestSession";
import { getSessionStatsDetailService } from "@/services/course_stats/session-detail";
import type { SessionStatsDetailDto } from "@/lib/types/queue";

interface PageProps {
  params: Promise<{ sessionPublicId: string }>;
}

export default async function SessionStatsDetailRoute({ params }: PageProps) {
  const { sessionPublicId } = await params;

  const session = await getRequestSession();
  if (!session) {
    redirect(
      `/api/auth/session?redirect=/instructor/course-stats/${sessionPublicId}`,
    );
  }

  // The service enforces the per-offering INSTRUCTOR check; on any failure
  // (not found / not authorized) send the user back to the overview.
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
