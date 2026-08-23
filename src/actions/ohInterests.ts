"use server";

import { requireSessionUserId } from "@/lib/auth/getRequestSession";
import {
  recordSessionInterest,
  retractSessionInterest,
  type RecordInterestResult,
  type RetractInterestResult,
} from "@/lib/ohInterests";

export async function recordInterest(
  sessionId: number,
): Promise<RecordInterestResult> {
  const userId = await requireSessionUserId();
  return recordSessionInterest(userId, sessionId);
}

export async function retractInterest(
  sessionId: number,
): Promise<RetractInterestResult> {
  const userId = await requireSessionUserId();
  return retractSessionInterest(userId, sessionId);
}
