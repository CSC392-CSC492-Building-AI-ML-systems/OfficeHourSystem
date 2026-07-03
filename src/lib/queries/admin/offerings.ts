import type { CourseRole } from "@prisma/client";

import {
  roleLabelForRole,
  workspaceHrefForRole,
  workspaceLabelForRole,
} from "@/lib/auth/resolveHomeRedirect";
import { prisma } from "@/lib/prisma";

export type AdminOfferingListItem = {
  offeringPublicId: string;
  courseCode: string;
  termCode: string;
  studentCount: number;
  instructorCount: number;
  createdAt: string;
  canAddInstructor: boolean;
  viewerRole: CourseRole | null;
  roleLabel: string | null;
  workspaceHref: string | null;
  workspaceLabel: string;
  canOpenCourse: boolean;
};

export type ListAllOfferingsOptions = {
  viewerUserId: number;
  viewerIsSuperAdmin: boolean;
};

export async function listAllOfferings(
  options: ListAllOfferingsOptions,
): Promise<AdminOfferingListItem[]> {
  const viewerMemberships = options.viewerIsSuperAdmin
    ? await prisma.offeringMember.findMany({
        where: { userId: options.viewerUserId },
        select: { offeringId: true, role: true },
      })
    : await prisma.offeringMember.findMany({
        where: {
          userId: options.viewerUserId,
          role: { in: ["INSTRUCTOR", "TA"] },
        },
        select: { offeringId: true, role: true },
      });

  const roleByOfferingId = new Map(
    viewerMemberships.map((membership) => [
      membership.offeringId,
      membership.role,
    ]),
  );

  const staffOfferingIds = new Set(
    [...roleByOfferingId.entries()]
      .filter(([, role]) => role === "INSTRUCTOR" || role === "TA")
      .map(([offeringId]) => offeringId),
  );
  const instructorOfferingIds = new Set(
    [...roleByOfferingId.entries()]
      .filter(([, role]) => role === "INSTRUCTOR")
      .map(([offeringId]) => offeringId),
  );

  const offerings = await prisma.courseOffering.findMany({
    where: options.viewerIsSuperAdmin
      ? undefined
      : { id: { in: [...staffOfferingIds] } },
    orderBy: [{ termCode: "desc" }, { course: { code: "asc" } }],
    select: {
      id: true,
      publicId: true,
      termCode: true,
      createdAt: true,
      course: { select: { code: true } },
      members: {
        select: { role: true },
      },
    },
  });

  return offerings.map((offering) => {
    const viewerRole = roleByOfferingId.get(offering.id) ?? null;
    const workspaceHref = workspaceHrefForRole(viewerRole, offering.publicId);

    return {
      offeringPublicId: offering.publicId,
      courseCode: offering.course.code,
      termCode: offering.termCode,
      studentCount: offering.members.filter((m) => m.role === "STUDENT").length,
      instructorCount: offering.members.filter((m) => m.role === "INSTRUCTOR")
        .length,
      createdAt: offering.createdAt.toISOString(),
      canAddInstructor:
        options.viewerIsSuperAdmin || instructorOfferingIds.has(offering.id),
      viewerRole,
      roleLabel: roleLabelForRole(viewerRole),
      workspaceHref,
      workspaceLabel: workspaceLabelForRole(viewerRole),
      canOpenCourse: workspaceHref !== null,
    };
  });
}
