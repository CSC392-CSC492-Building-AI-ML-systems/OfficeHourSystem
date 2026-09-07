"use server";

import { revalidatePath } from "next/cache";

import { requireSessionUserId } from "@/lib/auth/getRequestSession";
import {
  recordSessionInterest,
  retractSessionInterest,
  type RecordInterestResult,
  type RetractInterestResult,
} from "@/lib/ohInterests";

type InterestActionFailure = { ok: false; error: string };
type RecordInterestActionResult =
  | ({ ok: true } & RecordInterestResult)
  | InterestActionFailure;
type RetractInterestActionResult =
  | ({ ok: true } & RetractInterestResult)
  | InterestActionFailure;

function revalidateInterestViews() {
  revalidatePath("/");
  revalidatePath("/course");
  revalidatePath("/course/my-interested-office-hours");
  revalidatePath("/course/[offeringPublicId]/student", "page");
}

export async function recordInterest(
  sessionId: number,
): Promise<RecordInterestActionResult> {
  try {
    const userId = await requireSessionUserId();
    const result = await recordSessionInterest(userId, sessionId);
    revalidateInterestViews();
    return { ok: true, ...result };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Could not update interest.",
    };
  }
}

export async function retractInterest(
  sessionId: number,
): Promise<RetractInterestActionResult> {
  try {
    const userId = await requireSessionUserId();
    const result = await retractSessionInterest(userId, sessionId);
    revalidateInterestViews();
    return { ok: true, ...result };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Could not update interest.",
    };
  }
}
