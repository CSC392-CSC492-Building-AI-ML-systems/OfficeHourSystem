import type { CourseRole } from "@prisma/client";

import {
  roleLabelForRole,
  workspaceHrefForRole,
} from "@/lib/auth/resolveHomeRedirect";
import { prisma } from "@/lib/prisma";

export type CoursePickerItem = {
  offeringPublicId: string;
  courseCode: string;
  termCode: string;
  role: CourseRole;
  roleLabel: string;
  instructorNames: string[];
  href: string;
};

function personName(user: {
  firstName: string | null;
  lastName: string | null;
  utorid: string;
}): string {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.utorid
  );
}

/** All offerings the user belongs to, for the course picker grid. */
export async function listCoursePickerOfferings(
  userId: number,
): Promise<CoursePickerItem[]> {
  const memberships = await prisma.offeringMember.findMany({
    where: { userId },
    select: {
      role: true,
      offering: {
        select: {
          publicId: true,
          termCode: true,
          course: { select: { code: true } },
          members: {
            where: { role: "INSTRUCTOR" },
            select: {
              user: {
                select: { firstName: true, lastName: true, utorid: true },
              },
            },
            orderBy: { user: { lastName: "asc" } },
          },
        },
      },
    },
    orderBy: [
      { offering: { termCode: "desc" } },
      { offering: { course: { code: "asc" } } },
    ],
  });

  return memberships.flatMap(({ role, offering }) => {
    const href = workspaceHrefForRole(role, offering.publicId);
    const roleLabel = roleLabelForRole(role);
    if (!href || !roleLabel) return [];

    return [
      {
        offeringPublicId: offering.publicId,
        courseCode: offering.course.code,
        termCode: offering.termCode,
        role,
        roleLabel,
        instructorNames: offering.members.map((m) => personName(m.user)),
        href,
      },
    ];
  });
}
