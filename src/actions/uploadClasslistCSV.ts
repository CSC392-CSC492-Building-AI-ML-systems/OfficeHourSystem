"use server";

import { revalidatePath } from "next/cache";

import {
  uploadClasslistFromFormData,
  type ClasslistUploadResult,
} from "@/lib/csv/processClasslistCSV";

/**
 * Server action for instructor classlist upload from the UI.
 *
 * Expected FormData fields:
 *   - file: the uploaded classlist.csv
 *   - termCode: e.g. "20261"
 *
 * Requires `ohsystem_session` cookie with INSTRUCTOR role.
 *
 * Local test without UI:
 *   npx tsx scripts/upload-classlist.ts path/to/classlist.csv 20261
 */
export async function uploadClasslistCSV(
  formData: FormData,
): Promise<ClasslistUploadResult> {
  const result = await uploadClasslistFromFormData(formData);

  if (result.ok) {
    revalidatePath("/instructor");
  }

  return result;
}
