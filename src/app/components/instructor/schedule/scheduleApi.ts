import type {
  CreateOneTimeSessionInput,
  CreateRecurringBlockInput,
  RecurringRuleDto,
  ScheduleSessionDto,
  UpdateSessionInput,
} from "@/lib/scheduling/types";
import type { CalendarDay } from "./types";

export type ViewableOffering = {
  offeringPublicId: string;
  courseCode: string;
  termCode: string;
  role: string;
  canEdit: boolean;
};

export type SchedulePageResponse = {
  offerings: ViewableOffering[];
  offering: ViewableOffering | null;
  weekStart: string | null;
  weekLabel: string | null;
  calendarDays: CalendarDay[];
  sessions: ScheduleSessionDto[];
  rules: RecurringRuleDto[];
  canEdit: boolean;
  error?: string;
};

export async function fetchSchedulePage(params: {
  offeringPublicId?: string;
  weekStart?: string;
}): Promise<SchedulePageResponse> {
  const search = new URLSearchParams();
  if (params.offeringPublicId) {
    search.set("offeringPublicId", params.offeringPublicId);
  }
  if (params.weekStart) {
    search.set("weekStart", params.weekStart);
  }

  const response = await fetch(`/api/instructor/schedule?${search.toString()}`);
  const data = (await response.json()) as SchedulePageResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to load schedule.");
  }

  return data;
}

export async function updateRecurringBlockApi(
  publicId: string,
  body: {
    title?: string;
    location?: string | null;
    startTime?: string;
    endTime?: string;
  },
): Promise<void> {
  const response = await fetch(`/api/instructor/schedules/${publicId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to update recurring block.");
  }
}

export async function deleteRecurringBlockApi(publicId: string): Promise<void> {
  const response = await fetch(`/api/instructor/schedules/${publicId}`, {
    method: "DELETE",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to delete recurring block.");
  }
}

export async function createRecurringBlockApi(
  body: CreateRecurringBlockInput,
): Promise<{ schedulePublicIds: string[]; sessionsCreated: number }> {
  const response = await fetch("/api/instructor/schedules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to create recurring block.");
  }
  return data;
}

export async function createOneTimeSessionApi(
  body: CreateOneTimeSessionInput,
): Promise<void> {
  const response = await fetch("/api/instructor/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to create session.");
  }
}

export async function updateSessionApi(
  publicId: string,
  body: UpdateSessionInput,
): Promise<ScheduleSessionDto> {
  const response = await fetch(`/api/instructor/sessions/${publicId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to update session.");
  }
  return data.session;
}

export async function cancelSessionApi(publicId: string): Promise<void> {
  const response = await fetch(`/api/instructor/sessions/${publicId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cancel: true }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to cancel session.");
  }
}

export async function fetchQueueSessions(): Promise<{
  sessions: import("@/lib/scheduling/types").QueueSessionDto[];
}> {
  const response = await fetch("/api/instructor/queues?types=DEBUGGING");
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to load queues.");
  }
  return data;
}
