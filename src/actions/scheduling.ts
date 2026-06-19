"use server";

import { revalidatePath } from "next/cache";

import { requireSessionUserId } from "@/lib/auth/getRequestSession";
import {
  cancelSession,
  createOneTimeSession,
  createRecurringBlock,
  deleteRecurringBlock,
  getInstructorSchedulePage,
  getUpcomingSessionsForHost,
  updateRecurringBlock,
  updateSession,
} from "@/lib/queries/officeHourScheduling";
import type {
  CreateOneTimeSessionInput,
  CreateRecurringBlockInput,
  QueueSessionDto,
  SchedulePageResponse,
  ScheduleSessionDto,
  UpdateRecurringBlockInput,
  UpdateSessionInput,
} from "@/lib/scheduling/types";

function revalidateSchedulingPaths() {
  revalidatePath("/instructor/schedule");
  revalidatePath("/instructor/my-queues");
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
  revalidateSchedulingPaths();
  return result;
}

export async function updateRecurringBlockAction(
  publicId: string,
  patch: UpdateRecurringBlockInput,
): Promise<void> {
  const userId = await requireSessionUserId();
  await updateRecurringBlock(userId, publicId, patch);
  revalidateSchedulingPaths();
}

export async function deleteRecurringBlockAction(
  publicId: string,
): Promise<void> {
  const userId = await requireSessionUserId();
  await deleteRecurringBlock(userId, publicId);
  revalidateSchedulingPaths();
}

export async function createOneTimeSessionAction(
  input: CreateOneTimeSessionInput,
): Promise<void> {
  if (!input.title?.trim()) {
    throw new Error("Title is required.");
  }

  const userId = await requireSessionUserId();
  await createOneTimeSession(userId, input);
  revalidateSchedulingPaths();
}

export async function updateSessionAction(
  publicId: string,
  patch: UpdateSessionInput,
): Promise<ScheduleSessionDto> {
  const userId = await requireSessionUserId();
  const result = await updateSession(userId, publicId, patch);
  revalidateSchedulingPaths();
  return result.session;
}

export async function cancelSessionAction(publicId: string): Promise<void> {
  const userId = await requireSessionUserId();
  await cancelSession(userId, publicId);
  revalidateSchedulingPaths();
}

export async function getQueueSessionsAction(): Promise<{
  sessions: QueueSessionDto[];
}> {
  const userId = await requireSessionUserId();
  const sessions = await getUpcomingSessionsForHost(userId, {
    types: ["DEBUGGING"],
    daysAhead: 14,
  });
  return { sessions };
}
