"use server";

import { requireAdminSession } from "@/lib/auth/requireAdmin";
import {
  bulkUpsertInstructorsFromText,
  type BulkUpsertInstructorsResult,
} from "@/lib/queries/admin/bulkUpsertInstructors";

export async function bulkUpsertInstructorsAction(
  text: string,
): Promise<BulkUpsertInstructorsResult> {
  await requireAdminSession();
  return bulkUpsertInstructorsFromText(text);
}
