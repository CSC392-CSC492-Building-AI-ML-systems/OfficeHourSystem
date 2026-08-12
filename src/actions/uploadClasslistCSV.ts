"use server";

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
 *   pnpm dlx tsx scripts/upload-classlist.ts path/to/classlist.csv 20261
 */
export async function uploadClasslistCSV(
  formData: FormData,
): Promise<ClasslistUploadResult> {
  return uploadClasslistFromFormData(formData);
}
