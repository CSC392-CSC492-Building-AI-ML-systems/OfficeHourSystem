import type { CourseRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export class OfferingAccessError extends Error {
  constructor(
    message: string,
    readonly code: "missing" | "not_found" | "forbidden" = "forbidden",
  ) {
    super(message);
    this.name = "OfferingAccessError";
  }
}

export type OfferingContext = {
  offeringId: number;
  offeringPublicId: string;
  courseCode: string;
  termCode: string;
  role: CourseRole;
  canEdit: boolean;
};

export async function getOfferingByPublicId(offeringPublicId: string) {
  return prisma.courseOffering.findUnique({
    where: { publicId: offeringPublicId },
    select: {
      id: true,
      publicId: true,
      termCode: true,
      course: { select: { code: true } },
    },
  });
}

/** Load offering metadata and the user's membership role. */
export async function getOfferingContextForUser(
  userId: number,
  offeringPublicId: string,
): Promise<OfferingContext | null> {
  const offering = await getOfferingByPublicId(offeringPublicId);
  if (!offering) {
    return null;
  }

  const membership = await prisma.offeringMember.findUnique({
    where: {
      userId_offeringId: {
        userId,
        offeringId: offering.id,
      },
    },
    select: { role: true },
  });

  if (!membership) {
    return null;
  }

  return {
    offeringId: offering.id,
    offeringPublicId: offering.publicId,
    courseCode: offering.course.code,
    termCode: offering.termCode,
    role: membership.role,
    canEdit: membership.role === "INSTRUCTOR",
  };
}

export async function requireOfferingTeachingStaff(
  userId: number,
  offeringPublicId: string,
): Promise<OfferingContext> {
  if (!offeringPublicId.trim()) {
    throw new OfferingAccessError(
      "Course offering is required. Open a course from the admin page.",
      "missing",
    );
  }

  const context = await getOfferingContextForUser(userId, offeringPublicId);
  if (!context) {
    const offering = await getOfferingByPublicId(offeringPublicId);
    if (!offering) {
      throw new OfferingAccessError("Course offering not found.", "not_found");
    }
    throw new OfferingAccessError(
      "You do not have access to this course offering.",
      "forbidden",
    );
  }

  if (context.role === "STUDENT") {
    throw new OfferingAccessError(
      "Only instructors and teaching assistants can access this area.",
      "forbidden",
    );
  }

  return context;
}
