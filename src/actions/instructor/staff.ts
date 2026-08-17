"use server";

import { revalidatePath } from "next/cache";

import { parseAdminList } from "@/lib/adminList";
import { requireSessionUserId } from "@/lib/auth/getRequestSession";
import { requireOfferingTeachingStaff } from "@/lib/auth/requireOfferingAccess";
import { instructorDashboardHref } from "@/lib/offeringUrls";
import {
  addOrUpdateStaffMember,
  getOfferingStaffMembers,
  getOfferingStudentMembers,
  removeOfferingStaffMember,
  removeOfferingStudentMember,
  type OfferingStaffMember,
  type OfferingStudentMember,
} from "@/lib/queries/offeringMember";
import { requireScheduleMutate } from "@/lib/scheduling/auth";

export type InstructorStaffPageData = {
  staff: OfferingStaffMember[];
  students: OfferingStudentMember[];
};

export type StaffActionResult =
  | { ok: true; staffMember?: OfferingStaffMember }
  | { ok: false; error: string };

export type BulkStaffActionResult =
  | { ok: true; added: number; staff: OfferingStaffMember[] }
  | { ok: false; error: string };

export async function getInstructorStaffPageData(
  offeringPublicId: string,
): Promise<InstructorStaffPageData> {
  const userId = await requireSessionUserId();
  await requireOfferingTeachingStaff(userId, offeringPublicId);

  const [staff, students] = await Promise.all([
    getOfferingStaffMembers(offeringPublicId),
    getOfferingStudentMembers(offeringPublicId),
  ]);

  return { staff, students };
}

export async function addOfferingTaAction(input: {
  offeringPublicId: string;
  utorid: string;
}): Promise<StaffActionResult> {
  try {
    const userId = await requireSessionUserId();
    await requireScheduleMutate(userId, input.offeringPublicId);

    const utorid = input.utorid.trim();
    if (!utorid) {
      throw new Error("UTORid is required");
    }

    await addOrUpdateStaffMember(
      { utorid },
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

export async function bulkAddOfferingTasAction(input: {
  offeringPublicId: string;
  text: string;
}): Promise<BulkStaffActionResult> {
  try {
    const userId = await requireSessionUserId();
    await requireScheduleMutate(userId, input.offeringPublicId);

    const utorids = parseAdminList(input.text);
    if (utorids.length === 0) {
      throw new Error("No UTORids provided");
    }

    for (const utorid of utorids) {
      await addOrUpdateStaffMember(
        { utorid },
        { publicId: input.offeringPublicId },
        "TA",
      );
    }

    revalidatePath(instructorDashboardHref(input.offeringPublicId));

    const staff = await getOfferingStaffMembers(input.offeringPublicId);

    return { ok: true, added: utorids.length, staff };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to bulk add teaching assistants",
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

export async function removeOfferingStudentAction(input: {
  offeringPublicId: string;
  userPublicId: string;
}): Promise<StaffActionResult> {
  try {
    const userId = await requireSessionUserId();
    await requireScheduleMutate(userId, input.offeringPublicId);

    await removeOfferingStudentMember(
      input.offeringPublicId,
      input.userPublicId,
    );

    revalidatePath(instructorDashboardHref(input.offeringPublicId));

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Failed to remove student",
    };
  }
}
