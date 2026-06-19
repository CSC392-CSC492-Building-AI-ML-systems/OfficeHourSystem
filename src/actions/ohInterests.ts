"use server";

import { requireSessionUserId } from "@/lib/auth/getRequestSession";
import {
  recordSessionInterest,
  type RecordInterestResult,
} from "@/lib/ohInterests";

export async function recordInterest(
  sessionId: number,
): Promise<RecordInterestResult> {
  const userId = await requireSessionUserId();
  return recordSessionInterest(userId, sessionId);
}
