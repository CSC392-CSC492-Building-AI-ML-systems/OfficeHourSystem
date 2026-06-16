import type { CourseRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  getActiveOfferingMembership,
  listActiveTeachingMemberships,
  type ActiveTeachingMembership,
} from "@/lib/queries/offeringMember";

export class ScheduleAuthError extends Error {
  constructor(
    message: string,
    readonly status: 403 | 404 = 403,
  ) {
    super(message);
    this.name = "ScheduleAuthError";
  }
}

export type ScheduleAccess = {
  offeringId: number;
  offeringPublicId: string;
  courseCode: string;
  termCode: string;
  role: CourseRole;
  canEdit: boolean;
};

export async function getScheduleAccess(
  userId: number,
  offeringPublicId: string,
): Promise<ScheduleAccess | null> {
  const offering = await prisma.courseOffering.findUnique({
    where: { publicId: offeringPublicId },
    select: {
      id: true,
      publicId: true,
      termCode: true,
      course: { select: { code: true } },
    },
  });

  if (!offering) {
    return null;
  }

  const member = await getActiveOfferingMembership(userId, offering.id);
  if (!member || member.role === "STUDENT") {
    return null;
  }

  return {
    offeringId: offering.id,
    offeringPublicId: offering.publicId,
    courseCode: offering.course.code,
    termCode: offering.termCode,
    role: member.role,
    canEdit: member.role === "INSTRUCTOR",
  };
}

export async function requireScheduleView(
  userId: number,
  offeringPublicId: string,
): Promise<ScheduleAccess> {
  const access = await getScheduleAccess(userId, offeringPublicId);
  if (!access) {
    throw new ScheduleAuthError(
      "You do not have access to this course schedule.",
      403,
    );
  }
  return access;
}

export async function requireScheduleMutate(
  userId: number,
  offeringPublicId: string,
): Promise<ScheduleAccess> {
  const access = await requireScheduleView(userId, offeringPublicId);
  if (!access.canEdit) {
    throw new ScheduleAuthError(
      "Only course instructors can change the office hour schedule.",
      403,
    );
  }
  return access;
}

export async function listViewableOfferings(userId: number) {
  const members: ActiveTeachingMembership[] =
    await listActiveTeachingMemberships(userId);

  return members.map((member) => ({
    offeringPublicId: member.offering.publicId,
    courseCode: member.offering.course.code,
    termCode: member.offering.termCode,
    role: member.role as CourseRole,
    canEdit: member.role === "INSTRUCTOR",
  }));
}
