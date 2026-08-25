import type { OfficeHourType } from "@prisma/client";

import type { WeekdayKey } from "./time";

export type UiSessionType = "drop-in" | "debugging-queue" | "topic-group";

export function uiSessionTypeToOfficeHourType(
  type: UiSessionType,
): OfficeHourType {
  switch (type) {
    case "debugging-queue":
      return "DEBUGGING";
    case "topic-group":
      return "GROUP";
    default:
      return "REGULAR";
  }
}

export function officeHourTypeLabel(type: OfficeHourType): string {
  switch (type) {
    case "DEBUGGING":
      return "Help Centre";
    case "GROUP":
      return "Custom";
    default:
      return "Professor Office Hours";
  }
}

export type CreateRecurringBlockInput = {
  offeringPublicId: string;
  title: string;
  uiType: UiSessionType;
  weekdayKeys: WeekdayKey[];
  startTime: string;
  endTime: string;
  /** Inclusive start date (`YYYY-MM-DD`). Defaults from term when omitted. */
  validFrom?: string;
  /** Inclusive end date (`YYYY-MM-DD`). Defaults from term when omitted. */
  validUntil?: string;
  location?: string;
  description?: string;
  hostUserPublicIds?: string[];
};

export type CreateOneTimeSessionInput = {
  offeringPublicId: string;
  title: string;
  uiType: UiSessionType;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
  hostUserPublicIds?: string[];
};

export type UpdateSessionInput = {
  title?: string;
  location?: string | null;
  description?: string | null;
  date?: string;
  startTime?: string;
  endTime?: string;
  hostUserPublicIds?: string[];
};

export type ScheduleStaffDto = {
  publicId: string;
  name: string;
  role: string;
};

export type ScheduleSessionDto = {
  id: string;
  courseCode: string;
  courseName?: string;
  sessionTypeLabel: string;
  calendarLabel: string;
  title: string;
  topic: string;
  description?: string | null;
  day: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
  /** `YYYY-MM-DD` for editing session time. */
  date: string;
  /** 24h `HH:mm` for time pickers. */
  startTimeInput: string;
  endTimeInput: string;
  startHour: number;
  endHour: number;
  location: string;
  mode: "in-person" | "online" | "hybrid";
  accent: "navy-yellow" | "navy-red" | "yellow";
  isRecurringOccurrence?: boolean;
  hostPublicIds: string[];
  hostLabel: string;
  hasOverride?: boolean;
  overrideLocation?: string;
  interestedCount: number;
  checkedInCount: number;
};

export type RecurringRuleDto = {
  id: string;
  courseCode: string;
  sessionTypeLabel: string;
  title: string;
  description?: string | null;
  repeats: string;
  validFrom: string;
  validUntil: string;
  /** `YYYY-MM-DD` for apply-from date picker. */
  validFromInput: string;
  validUntilInput: string;
  defaultTime: string;
  startTime: string;
  endTime: string;
  defaultLocation: string;
  mode: "in-person" | "online" | "hybrid";
  accent: "navy" | "red" | "gold";
  hostPublicIds: string[];
  hostLabel: string;
};

export type UpdateRecurringBlockInput = {
  title?: string;
  location?: string | null;
  description?: string | null;
  startTime?: string;
  endTime?: string;
  /** Inclusive `YYYY-MM-DD`. Sessions before this date are left unchanged. Defaults to today. */
  applyFrom?: string;
  hostUserPublicIds?: string[];
};

export type OneTimeSessionListItemDto = {
  id: string;
  title: string;
  description?: string | null;
  sessionTypeLabel: string;
  date: string;
  dateLabel: string;
  timeLabel: string;
  location: string;
  hostLabel: string;
  status: string;
};

export type QueueSessionDto = {
  id: string;
  courseLabel: string;
  title: string;
  time: string;
  location: string;
  isHighlighted: boolean;
  workspaceSubtitle: string;
  lastScanLabel: string;
};

export type CalendarDayDto = {
  key: string;
  label: string;
  date: string;
};

export type ViewableOffering = {
  offeringPublicId: string;
  courseCode: string;
  termCode: string;
  role: string;
  canEdit: boolean;
};

export type SchedulePageResponse = {
  offering: ViewableOffering | null;
  weekStart: string | null;
  weekLabel: string | null;
  calendarDays: CalendarDayDto[];
  sessions: ScheduleSessionDto[];
  rules: RecurringRuleDto[];
  oneTimeSessions: OneTimeSessionListItemDto[];
  staff: ScheduleStaffDto[];
  canEdit: boolean;
  currentUserPublicId: string | null;
};
