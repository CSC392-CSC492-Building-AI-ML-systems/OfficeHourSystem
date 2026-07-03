"use server";

import { revalidatePath } from "next/cache";

import { requireSessionUserId } from "@/lib/auth/getRequestSession";
import {
  courseInstructorActiveQueuePath,
  courseInstructorQueuesPath,
  courseInstructorSchedulePath,
  instructorDashboardHref,
} from "@/lib/offeringUrls";
import {
  cancelSession,
  createOneTimeSession,
  createRecurringBlock,
  deleteRecurringBlock,
  getInstructorSchedulePage,
  updateRecurringBlock,
  updateSession,
} from "@/lib/queries/officeHourScheduling";
import type {
  CreateOneTimeSessionInput,
  CreateRecurringBlockInput,
  SchedulePageResponse,
  ScheduleSessionDto,
  UpdateRecurringBlockInput,
  UpdateSessionInput,
} from "@/lib/scheduling/types";

function revalidateSchedulingPaths(offeringPublicId: string) {
  revalidatePath(instructorDashboardHref(offeringPublicId));
  revalidatePath(courseInstructorSchedulePath(offeringPublicId));
  revalidatePath(courseInstructorQueuesPath(offeringPublicId));
  revalidatePath(courseInstructorActiveQueuePath(offeringPublicId));
}

export async function getSchedulePageAction(params: {
  offeringPublicId?: string;
  weekStart?: string;
}): Promise<SchedulePageResponse> {
  const userId = await requireSessionUserId();
  return getInstructorSchedulePage(
    userId,
    params.offeringPublicId,
    params.weekStart,
  );
}

export async function createRecurringBlockAction(
  input: CreateRecurringBlockInput,
): Promise<{ schedulePublicIds: string[]; sessionsCreated: number }> {
  const userId = await requireSessionUserId();
  const result = await createRecurringBlock(userId, {
    ...input,
    title: input.title?.trim() ? input.title.trim() : "Office Hours",
  });
  revalidateSchedulingPaths(input.offeringPublicId);
  return result;
}

export async function updateRecurringBlockAction(
  publicId: string,
  patch: UpdateRecurringBlockInput,
): Promise<void> {
  const userId = await requireSessionUserId();
  const result = await updateRecurringBlock(userId, publicId, patch);
  revalidateSchedulingPaths(result.offeringPublicId);
}

export async function deleteRecurringBlockAction(
  publicId: string,
): Promise<void> {
  const userId = await requireSessionUserId();
  const result = await deleteRecurringBlock(userId, publicId);
  revalidateSchedulingPaths(result.offeringPublicId);
}

export async function createOneTimeSessionAction(
  input: CreateOneTimeSessionInput,
): Promise<void> {
  if (!input.title?.trim()) {
    throw new Error("Title is required.");
  }

  const userId = await requireSessionUserId();
  await createOneTimeSession(userId, input);
  revalidateSchedulingPaths(input.offeringPublicId);
}

export async function updateSessionAction(
  publicId: string,
  patch: UpdateSessionInput,
): Promise<ScheduleSessionDto> {
  const userId = await requireSessionUserId();
  const result = await updateSession(userId, publicId, patch);
  revalidateSchedulingPaths(result.offeringPublicId);
  return result.session;
}

export async function cancelSessionAction(publicId: string): Promise<void> {
  const userId = await requireSessionUserId();
  const result = await cancelSession(userId, publicId);
  revalidateSchedulingPaths(result.offeringPublicId);
}
