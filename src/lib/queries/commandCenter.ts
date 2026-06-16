import {
  getActiveOfferingMembership,
  getInstanceOffering,
  listActiveTas,
} from "@/lib/queries/offeringMember";

export type CommandCenterPageData = {
  offering: {
    offeringPublicId: string;
    courseCode: string;
    termCode: string;
  };
  canManageTas: boolean;
  tas: Awaited<ReturnType<typeof listActiveTas>>;
};

export async function getCommandCenterPage(
  userId: number,
): Promise<CommandCenterPageData> {
  const offering = await getInstanceOffering();
  const membership = await getActiveOfferingMembership(userId, offering.id);

  if (
    !membership ||
    membership.role === "STUDENT" ||
    (membership.role !== "INSTRUCTOR" && membership.role !== "TA")
  ) {
    throw new Error("Forbidden: only instructors and TAs can view this page");
  }

  const tas = await listActiveTas({ publicId: offering.publicId });

  return {
    offering: {
      offeringPublicId: offering.publicId,
      courseCode: offering.course.code,
      termCode: offering.termCode,
    },
    canManageTas: membership.role === "INSTRUCTOR",
    tas,
  };
}

export async function requireInstructorForInstanceOffering(
  userId: number,
): Promise<{ offeringId: number; offeringPublicId: string }> {
  const offering = await getInstanceOffering();
  const membership = await getActiveOfferingMembership(userId, offering.id);

  if (!membership || membership.role !== "INSTRUCTOR") {
    throw new Error(
      "Forbidden: only instructors can manage teaching assistants",
    );
  }

  return {
    offeringId: offering.id,
    offeringPublicId: offering.publicId,
  };
}
