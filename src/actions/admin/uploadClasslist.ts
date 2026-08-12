"use server";

import { revalidatePath } from "next/cache";

import { userCanAccessAdmin } from "@/lib/auth/canAccessAdmin";
import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { parseClasslistCSVText } from "@/lib/csv/parseCSV";
import { importClasslist } from "@/lib/queries/classlist";
import { addOrUpdateStaffMember } from "@/lib/queries/offeringMember";

export type AdminClasslistUploadSuccess = {
  ok: true;
  courseCode: string;
  termCode: string;
  offeringPublicId: string;
  imported: number;
  cleared: number;
};

export type AdminClasslistUploadFailure = {
  ok: false;
  error: string;
};

export type AdminClasslistUploadResult =
  | AdminClasslistUploadSuccess
  | AdminClasslistUploadFailure;

export async function uploadAdminClasslistAction(
  formData: FormData,
): Promise<AdminClasslistUploadResult> {
  try {
    const session = await getRequestSession();
    if (!session) {
      throw new Error("Authentication required");
    }

    const userId = parseSessionUserId(session);
    if (!(await userCanAccessAdmin(userId, session.utorid))) {
      throw new Error("Instructor or admin access required");
    }

    const termCode = formData.get("termCode");
    if (typeof termCode !== "string" || termCode.trim().length === 0) {
      throw new Error('Missing term code. Expected form field "termCode".');
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new Error('Missing CSV file. Expected form field "file".');
    }

    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      throw new Error("Upload must be a .csv file");
    }

    const rows = parseClasslistCSVText(await file.text());
    if (rows.length === 0) {
      throw new Error("CSV file contains no student rows");
    }

    const courseCode = rows[0].Acad_act.trim();
    const result = await importClasslist({
      termCode: termCode.trim(),
      rows,
    });

    await addOrUpdateStaffMember(
      { utorid: session.utorid },
      { publicId: result.offeringPublicId },
      "INSTRUCTOR",
    );

    revalidatePath("/admin");
    revalidatePath("/course");

    return {
      ok: true,
      courseCode,
      termCode: termCode.trim(),
      offeringPublicId: result.offeringPublicId,
      imported: result.imported,
      cleared: result.cleared,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Classlist upload failed",
    };
  }
}
