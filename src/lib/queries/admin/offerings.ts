import { prisma } from "@/lib/prisma";

export type AdminOfferingListItem = {
  offeringPublicId: string;
  courseCode: string;
  termCode: string;
  studentCount: number;
  instructorCount: number;
  createdAt: string;
  canAddInstructor: boolean;
};

export type ListAllOfferingsOptions = {
  viewerUserId: number;
  viewerIsSuperAdmin: boolean;
};

export async function listAllOfferings(
  options: ListAllOfferingsOptions,
): Promise<AdminOfferingListItem[]> {
  const [offerings, instructorMemberships] = await Promise.all([
    prisma.courseOffering.findMany({
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
    }),
    options.viewerIsSuperAdmin
      ? Promise.resolve([])
      : prisma.offeringMember.findMany({
          where: {
            userId: options.viewerUserId,
            role: "INSTRUCTOR",
          },
          select: { offeringId: true },
        }),
  ]);

  const instructorOfferingIds = new Set(
    instructorMemberships.map((membership) => membership.offeringId),
  );

  return offerings.map((offering) => ({
    offeringPublicId: offering.publicId,
    courseCode: offering.course.code,
    termCode: offering.termCode,
    studentCount: offering.members.filter((m) => m.role === "STUDENT").length,
    instructorCount: offering.members.filter((m) => m.role === "INSTRUCTOR")
      .length,
    createdAt: offering.createdAt.toISOString(),
    canAddInstructor:
      options.viewerIsSuperAdmin || instructorOfferingIds.has(offering.id),
  }));
}
