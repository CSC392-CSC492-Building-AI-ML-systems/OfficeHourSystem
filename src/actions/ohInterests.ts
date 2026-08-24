"use server";

import { revalidatePath } from "next/cache";

import { requireSessionUserId } from "@/lib/auth/getRequestSession";
import {
  recordSessionInterest,
  retractSessionInterest,
  type RecordInterestResult,
  type RetractInterestResult,
} from "@/lib/ohInterests";

function revalidateInterestViews() {
  revalidatePath("/");
  revalidatePath("/course");
  revalidatePath("/course/my-interested-office-hours");
  revalidatePath("/course/[offeringPublicId]/student", "page");
}

export async function recordInterest(
  sessionId: number,
): Promise<RecordInterestResult> {
  const userId = await requireSessionUserId();
  const result = await recordSessionInterest(userId, sessionId);
  revalidateInterestViews();
  return result;
}

export async function retractInterest(
  sessionId: number,
): Promise<RetractInterestResult> {
  const userId = await requireSessionUserId();
  const result = await retractSessionInterest(userId, sessionId);
  revalidateInterestViews();
  return result;
}
