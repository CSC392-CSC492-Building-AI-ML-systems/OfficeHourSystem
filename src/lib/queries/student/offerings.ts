import { workspaceHrefForRole } from "@/lib/auth/resolveHomeRedirect";
import { prisma } from "@/lib/prisma";

export type StudentOfferingListItem = {
  offeringPublicId: string;
  courseCode: string;
  termCode: string;
  courseLabel: string;
  workspaceHref: string;
};

export async function listStudentOfferings(
  userId: number,
): Promise<StudentOfferingListItem[]> {
  const memberships = await prisma.offeringMember.findMany({
    where: { userId, role: "STUDENT" },
    select: {
      offering: {
        select: {
          publicId: true,
          termCode: true,
          course: { select: { code: true } },
        },
      },
    },
    orderBy: [
      { offering: { termCode: "desc" } },
      { offering: { course: { code: "asc" } } },
    ],
  });

  return memberships.map(({ offering }) => ({
    offeringPublicId: offering.publicId,
    courseCode: offering.course.code,
    termCode: offering.termCode,
    courseLabel: `${offering.course.code} · Term ${offering.termCode}`,
    workspaceHref: workspaceHrefForRole("STUDENT", offering.publicId)!,
  }));
}
