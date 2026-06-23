"use server";

import { getSessionStatsDetailService } from "@/services/course_stats/session-detail";
import type { SessionStatsDetailDto } from "@/lib/types/queue";

// Called on the session detail page load and by its Refresh button.
export async function getSessionStatsDetailAction(
  sessionPublicId: string,
): Promise<SessionStatsDetailDto> {
  return getSessionStatsDetailService(sessionPublicId);
}
