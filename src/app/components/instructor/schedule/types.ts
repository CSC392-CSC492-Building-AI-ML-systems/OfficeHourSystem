export interface ScheduleSession {
  id: string;
  courseCode: string;
  courseName?: string;
  sessionTypeLabel: string;
  calendarLabel: string;
  title: string;
  topic: string;
  day: string;
  dateLabel: string;
  date: string;
  startTime: string;
  endTime: string;
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
}

export interface ScheduleStaffMember {
  publicId: string;
  name: string;
  role: string;
}

export interface RecurringRule {
  id: string;
  courseCode: string;
  sessionTypeLabel: string;
  title: string;
  repeats: string;
  validFrom: string;
  validUntil: string;
  defaultTime: string;
  startTime: string;
  endTime: string;
  defaultLocation: string;
  mode: "in-person" | "online" | "hybrid";
  accent: "navy" | "red" | "gold";
}

export interface CalendarDay {
  key: string;
  label: string;
  date: string;
}

export interface TimeSlot {
  label: string;
  hour: number;
}
