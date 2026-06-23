"use server";

import {
  getCourseOverviewService,
  getCourseStudentDetailsService,
} from "@/services/course_stats/course-overview";
import type {
  CourseOverviewDto,
  CourseStudentDetailDto,
} from "@/lib/types/queue";

// Refresh the course overview (re-validates the cookie server-side).
export async function getCourseOverviewAction(
  offeringPublicId: string,
): Promise<CourseOverviewDto> {
  return getCourseOverviewService(offeringPublicId);
}

// Lazily load the per-student detail when the user clicks "View details".
export async function getCourseStudentDetailsAction(
  offeringPublicId: string,
): Promise<CourseStudentDetailDto[]> {
  return getCourseStudentDetailsService(offeringPublicId);
}
