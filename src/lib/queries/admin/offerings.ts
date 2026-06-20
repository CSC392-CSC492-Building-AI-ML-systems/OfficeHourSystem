import { prisma } from "@/lib/prisma";

export type AdminOfferingListItem = {
  offeringPublicId: string;
  courseCode: string;
  termCode: string;
  studentCount: number;
  instructorCount: number;
  createdAt: string;
};

export async function listAllOfferings(): Promise<AdminOfferingListItem[]> {
  const offerings = await prisma.courseOffering.findMany({
    orderBy: [{ termCode: "desc" }, { course: { code: "asc" } }],
    select: {
      publicId: true,
      termCode: true,
      createdAt: true,
      course: { select: { code: true } },
      members: {
        select: { role: true },
      },
    },
  });

  return offerings.map((offering) => ({
    offeringPublicId: offering.publicId,
    courseCode: offering.course.code,
    termCode: offering.termCode,
    studentCount: offering.members.filter((m) => m.role === "STUDENT").length,
    instructorCount: offering.members.filter((m) => m.role === "INSTRUCTOR")
      .length,
    createdAt: offering.createdAt.toISOString(),
  }));
}
