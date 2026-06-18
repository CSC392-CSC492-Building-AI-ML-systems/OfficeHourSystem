"use server";

import { revertToWaitingService } from "@/services/revert_to_waiting/revert-to-waiting";

export async function revertToWaitingAction(
  sessionPublicId: string,
  attendancePublicId: string,
) {
  return revertToWaitingService(sessionPublicId, attendancePublicId);
}
