"use server";

import { revalidatePath } from "next/cache";

import { requireSessionUserId } from "@/lib/auth/getRequestSession";
import {
  recordSessionInterest,
  removeSessionInterest,
  type RecordInterestResult,
  type RemoveInterestResult,
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

export async function removeInterest(
  sessionId: number,
): Promise<RemoveInterestResult> {
  const userId = await requireSessionUserId();
  const result = await removeSessionInterest(userId, sessionId);
  revalidateInterestViews();
  return result;
}
