"use server";

import { getActiveQueueService } from "@/services/get_active_queue/get-active-queue";
import type { ActiveQueueDto } from "@/lib/types/queue";

// Action: called when a TA opens a session workspace
// sessionPublicId comes from the URL e.g. /instructor/my-queues/active?sessionId=xxx
export async function getActiveQueueAction(
  sessionPublicId: string,
): Promise<ActiveQueueDto> {
  return getActiveQueueService(sessionPublicId);
}
