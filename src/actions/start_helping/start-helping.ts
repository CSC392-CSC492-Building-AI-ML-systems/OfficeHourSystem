"use server";

import { startHelpingService } from "@/services/start_helping/start-helping";

export async function startHelpingAction(
  sessionPublicId: string,
  attendancePublicId: string,
) {
  return startHelpingService(sessionPublicId, attendancePublicId);
}
