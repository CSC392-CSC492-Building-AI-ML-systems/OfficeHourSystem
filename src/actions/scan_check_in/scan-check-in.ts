"use server";

import { scanCheckInService } from "@/services/scan_check_in/scan-check-in";
import type { IdentifierType } from "@/lib/types/queue";

export async function scanCheckInAction(
  sessionPublicId: string,
  identifierType: IdentifierType,
  identifierValue: string,
) {
  return scanCheckInService(sessionPublicId, identifierType, identifierValue);
}
