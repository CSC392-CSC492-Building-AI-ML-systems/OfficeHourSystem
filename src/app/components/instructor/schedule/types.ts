export interface ScheduleSession {
  id: string;
  courseCode: string;
  courseName?: string;
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
  hasWarning?: boolean;
  hasLocationOverride?: boolean;
  overrideLocation?: string;
}

export interface RecurringRule {
  id: string;
  courseCode: string;
  title: string;
  repeats: string;
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
