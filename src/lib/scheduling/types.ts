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
      return "Debugging Queue";
    case "GROUP":
      return "Topic Group";
    default:
      return "Drop-in";
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
  hostUserPublicIds?: string[];
};

export type UpdateSessionInput = {
  title?: string;
  location?: string | null;
  date?: string;
  startTime?: string;
  endTime?: string;
};

export type ScheduleSessionDto = {
  id: string;
  courseCode: string;
  courseName?: string;
  sessionTypeLabel: string;
  calendarLabel: string;
  title: string;
  topic: string;
  day: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
  startHour: number;
  endHour: number;
  location: string;
  mode: "in-person" | "online" | "hybrid";
  accent: "navy-yellow" | "navy-red" | "yellow";
  hasLocationOverride?: boolean;
  overrideLocation?: string;
};

export type RecurringRuleDto = {
  id: string;
  courseCode: string;
  sessionTypeLabel: string;
  title: string;
  repeats: string;
  defaultTime: string;
  startTime: string;
  endTime: string;
  defaultLocation: string;
  mode: "in-person" | "online" | "hybrid";
  accent: "navy" | "red" | "gold";
};

export type UpdateRecurringBlockInput = {
  title?: string;
  location?: string | null;
  startTime?: string;
  endTime?: string;
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
  offerings: ViewableOffering[];
  offering: ViewableOffering | null;
  weekStart: string | null;
  weekLabel: string | null;
  calendarDays: CalendarDayDto[];
  sessions: ScheduleSessionDto[];
  rules: RecurringRuleDto[];
  canEdit: boolean;
};
