"use server";

import { revalidatePath } from "next/cache";

import { requireSessionUserId } from "@/lib/auth/getRequestSession";
import { instructorDashboardHref } from "@/lib/offeringUrls";
import {
  addOrUpdateStaffMember,
  getActiveWeeklySlotCount,
  getOfferingStaffMembers,
  removeOfferingStaffMember,
  type OfferingStaffMember,
} from "@/lib/queries/offeringMember";
import { requireScheduleMutate } from "@/lib/scheduling/auth";

export type InstructorStaffPageData = {
  staff: OfferingStaffMember[];
  weeklySlotCount: number;
};

export type StaffActionResult =
  | { ok: true; staffMember?: OfferingStaffMember }
  | { ok: false; error: string };

export async function getInstructorStaffPageData(
  offeringPublicId: string,
): Promise<InstructorStaffPageData> {
  const [staff, weeklySlotCount] = await Promise.all([
    getOfferingStaffMembers(offeringPublicId),
    getActiveWeeklySlotCount(offeringPublicId),
  ]);

  return { staff, weeklySlotCount };
}

export async function addOfferingTaAction(input: {
  offeringPublicId: string;
  utorid: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}): Promise<StaffActionResult> {
  try {
    const userId = await requireSessionUserId();
    await requireScheduleMutate(userId, input.offeringPublicId);

    const utorid = input.utorid.trim();
    if (!utorid) {
      throw new Error("UTORid is required");
    }

    await addOrUpdateStaffMember(
      {
        utorid,
        firstName: input.firstName?.trim() || undefined,
        lastName: input.lastName?.trim() || undefined,
        email: input.email?.trim() || undefined,
      },
      { publicId: input.offeringPublicId },
      "TA",
    );

    revalidatePath(instructorDashboardHref(input.offeringPublicId));

    const staff = await getOfferingStaffMembers(input.offeringPublicId);
    const staffMember = staff.find(
      (member) => member.utorid.toLowerCase() === utorid.toLowerCase(),
    );

    return { ok: true, staffMember };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to add teaching assistant",
    };
  }
}

export async function removeOfferingTaAction(input: {
  offeringPublicId: string;
  userPublicId: string;
}): Promise<StaffActionResult> {
  try {
    const userId = await requireSessionUserId();
    await requireScheduleMutate(userId, input.offeringPublicId);

    await removeOfferingStaffMember(input.offeringPublicId, input.userPublicId);

    revalidatePath(instructorDashboardHref(input.offeringPublicId));

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to remove teaching assistant",
    };
  }
}
