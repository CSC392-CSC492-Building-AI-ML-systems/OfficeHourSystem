import type { CourseRole, Prisma } from "@prisma/client";

/** Mirrors Prisma `OfferingMemberStatus` — kept local so tooling stays stable. */
export type OfferingMemberStatus = "ACTIVE" | "INACTIVE";

export const ACTIVE_OFFERING_MEMBER_STATUS: OfferingMemberStatus = "ACTIVE";
export const INACTIVE_OFFERING_MEMBER_STATUS: OfferingMemberStatus = "INACTIVE";

/** Build offering-member rows for Prisma writes in tests and seed scripts. */
export function offeringMemberRow(input: {
  userId: number;
  offeringId: number;
  role: CourseRole;
  status?: OfferingMemberStatus;
}): Prisma.OfferingMemberUncheckedCreateInput {
  return {
    userId: input.userId,
    offeringId: input.offeringId,
    role: input.role,
    status: input.status ?? ACTIVE_OFFERING_MEMBER_STATUS,
  } as Prisma.OfferingMemberUncheckedCreateInput;
}

export type OfferingMemberRoleStatus = {
  role: CourseRole;
  status: OfferingMemberStatus;
};

export const offeringMemberRoleStatusSelect = {
  role: true,
  status: true,
} as Prisma.OfferingMemberSelect;
