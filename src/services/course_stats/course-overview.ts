import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { prisma } from "@/lib/prisma";
import {
  getCourseOverview,
  getCourseStudentDetails,
  getInstructorOfferings,
  getOfferingByPublicId,
} from "@/lib/queries/course_stats/course-overview";
import type {
  CourseOverviewDto,
  CourseStudentDetailDto,
  InstructorOfferingDto,
} from "@/lib/types/queue";

// List the offerings the current user is an INSTRUCTOR of (for the picker).
// Returns [] if none — the caller decides to redirect.
export async function listInstructorOfferingsService(): Promise<
  InstructorOfferingDto[]
> {
  const session = await getRequestSession();
  if (!session) throw new Error("Unauthorized");
  const userId = parseSessionUserId(session);
  return getInstructorOfferings(userId);
}

// Shared auth: cookie valid AND user is INSTRUCTOR in THIS offering.
async function requireInstructorOffering(offeringPublicId: string) {
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
  return offering;
}

export async function getCourseOverviewService(
  offeringPublicId: string,
): Promise<CourseOverviewDto> {
  const offering = await requireInstructorOffering(offeringPublicId);
  return getCourseOverview({
    id: offering.id,
    publicId: offering.publicId,
    termCode: offering.termCode,
    courseCode: offering.course.code,
  });
}

export async function getCourseStudentDetailsService(
  offeringPublicId: string,
): Promise<CourseStudentDetailDto[]> {
  const offering = await requireInstructorOffering(offeringPublicId);
  return getCourseStudentDetails(offering.id);
}
