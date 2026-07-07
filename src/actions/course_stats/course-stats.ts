"use server";

import {
  getOfferingSessionStatsService,
  type OfferingSessionStats,
} from "@/services/course_stats/course-stats";

// Session-level stats for one offering (page load + Refresh button).
export async function getOfferingSessionStatsAction(
  offeringPublicId: string,
): Promise<OfferingSessionStats> {
  return getOfferingSessionStatsService(offeringPublicId);
}
