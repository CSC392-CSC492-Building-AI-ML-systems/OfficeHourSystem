"use server";

import { revalidatePath } from "next/cache";

import { requireAdminPageAccess } from "@/lib/auth/canAccessAdmin";
import { addOrUpdateStaffMember } from "@/lib/queries/offeringMember";

export type AddOfferingInstructorResult =
  | { ok: true; created: boolean }
  | { ok: false; error: string };

export async function addOfferingInstructorAction(input: {
  offeringPublicId: string;
  utorid: string;
}): Promise<AddOfferingInstructorResult> {
  try {
    await requireAdminPageAccess();

    const utorid = input.utorid.trim();
    if (!utorid) {
      throw new Error("UTORid is required");
    }

    const result = await addOrUpdateStaffMember(
      { utorid },
      { publicId: input.offeringPublicId },
      "INSTRUCTOR",
    );

    revalidatePath("/admin");

    return { ok: true, created: result.created };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to add instructor to offering",
    };
  }
}
