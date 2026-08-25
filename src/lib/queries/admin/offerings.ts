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
  archivedAt: string | null;
  canAddInstructor: boolean;
  canManageOffering: boolean;
  viewerRole: CourseRole | null;
  roleLabel: string | null;
  workspaceHref: string | null;
  workspaceLabel: string;
  canOpenCourse: boolean;
};

export type ListAllOfferingsOptions = {
  viewerUserId: number;
  viewerIsSuperAdmin: boolean;
  includeArchived?: boolean;
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
    where: {
      ...(options.viewerIsSuperAdmin
        ? {}
        : { id: { in: [...staffOfferingIds] } }),
      ...(options.includeArchived ? {} : { archivedAt: null }),
    },
    orderBy: [{ termCode: "desc" }, { course: { code: "asc" } }],
    select: {
      id: true,
      publicId: true,
      termCode: true,
      createdAt: true,
      archivedAt: true,
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
      archivedAt: offering.archivedAt?.toISOString() ?? null,
      canAddInstructor:
        options.viewerIsSuperAdmin || instructorOfferingIds.has(offering.id),
      canManageOffering:
        options.viewerIsSuperAdmin || instructorOfferingIds.has(offering.id),
      viewerRole,
      roleLabel: roleLabelForRole(viewerRole),
      workspaceHref,
      workspaceLabel: workspaceLabelForRole(viewerRole),
      canOpenCourse: workspaceHref !== null && offering.archivedAt === null,
    };
  });
}

export async function archiveOffering(offeringPublicId: string): Promise<void> {
  const offering = await prisma.courseOffering.findUnique({
    where: { publicId: offeringPublicId },
    select: { id: true, archivedAt: true },
  });

  if (!offering) {
    throw new Error("Course offering not found");
  }

  if (offering.archivedAt) {
    throw new Error("This course offering is already archived");
  }

  await prisma.courseOffering.update({
    where: { id: offering.id },
    data: { archivedAt: new Date() },
  });
}

export async function unarchiveOffering(
  offeringPublicId: string,
): Promise<void> {
  const offering = await prisma.courseOffering.findUnique({
    where: { publicId: offeringPublicId },
    select: { id: true, archivedAt: true },
  });

  if (!offering) {
    throw new Error("Course offering not found");
  }

  if (!offering.archivedAt) {
    throw new Error("This course offering is not archived");
  }

  await prisma.courseOffering.update({
    where: { id: offering.id },
    data: { archivedAt: null },
  });
}

/** Hard-delete an offering and all dependent scheduling/queue data. */
export async function deleteOffering(offeringPublicId: string): Promise<void> {
  const offering = await prisma.courseOffering.findUnique({
    where: { publicId: offeringPublicId },
    select: { id: true, courseId: true },
  });

  if (!offering) {
    throw new Error("Course offering not found");
  }

  const [reminderTable] = await prisma.$queryRaw<
    Array<{ exists: boolean }>
  >`SELECT to_regclass('public."OfficeHourReminder"') IS NOT NULL AS "exists"`;

  await prisma.$transaction(async (tx) => {
    if (reminderTable?.exists) {
      await tx.officeHourReminder.deleteMany({
        where: { interest: { session: { offeringId: offering.id } } },
      });
    }
    await tx.officeHourInterest.deleteMany({
      where: { session: { offeringId: offering.id } },
    });
    await tx.officeHourAttendance.deleteMany({
      where: { session: { offeringId: offering.id } },
    });
    await tx.officeHourAttendanceRecord.deleteMany({
      where: { session: { offeringId: offering.id } },
    });
    await tx.officeHourSessionHost.deleteMany({
      where: { session: { offeringId: offering.id } },
    });
    await tx.officeHourSession.deleteMany({
      where: { offeringId: offering.id },
    });
    await tx.officeHourScheduleHost.deleteMany({
      where: { schedule: { offeringId: offering.id } },
    });
    await tx.officeHourSchedule.deleteMany({
      where: { offeringId: offering.id },
    });
    await tx.offeringMember.deleteMany({
      where: { offeringId: offering.id },
    });
    await tx.courseOffering.delete({
      where: { id: offering.id },
    });

    const remaining = await tx.courseOffering.count({
      where: { courseId: offering.courseId },
    });
    if (remaining === 0) {
      await tx.course.delete({ where: { id: offering.courseId } });
    }
  });
}
