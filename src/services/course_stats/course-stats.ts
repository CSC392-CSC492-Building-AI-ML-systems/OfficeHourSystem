import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { prisma } from "@/lib/prisma";
import { getOfferingByPublicId } from "@/lib/queries/course_stats/course-overview";
import { getSessionStatsForOffering } from "@/lib/queries/course_stats/course-stats";
import type { CourseStatsSessionDto } from "@/lib/types/queue";

export type OfferingSessionStats = {
  courseCode: string;
  termCode: string;
  sessions: CourseStatsSessionDto[];
};

// Session-level stats for ONE offering. Cookie valid AND user is INSTRUCTOR of
// this specific offering. Used by the per-session page and its Refresh button.
export async function getOfferingSessionStatsService(
  offeringPublicId: string,
): Promise<OfferingSessionStats> {
  const session = await getRequestSession();
  if (!session) throw new Error("Unauthorized");
  const userId = parseSessionUserId(session);

  const offering = await getOfferingByPublicId(offeringPublicId);
  if (!offering) throw new Error("Offering not found");

  const member = await prisma.offeringMember.findUnique({
    where: { userId_offeringId: { userId, offeringId: offering.id } },
    select: { role: true },
  });
  if (!member || member.role !== "INSTRUCTOR") {
    throw new Error(
      "Forbidden: only the course instructor can view course stats",
    );
  }

  const sessions = await getSessionStatsForOffering(offering.id);
  return {
    courseCode: offering.course.code,
    termCode: offering.termCode,
    sessions,
  };
}
