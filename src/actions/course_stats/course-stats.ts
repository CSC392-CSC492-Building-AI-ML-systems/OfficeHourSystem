"use server";

import {
  canViewCourseStats,
  getOfferingSessionStatsService,
  type OfferingSessionStats,
} from "@/services/course_stats/course-stats";

// Session-level stats for one offering (page load + Refresh button).
export async function getOfferingSessionStatsAction(
  offeringPublicId: string,
): Promise<OfferingSessionStats> {
  return getOfferingSessionStatsService(offeringPublicId);
}

// Used by the navbar to show/hide the "My Course Stats" link.
export async function canViewCourseStatsAction(): Promise<boolean> {
  return canViewCourseStats();
}
