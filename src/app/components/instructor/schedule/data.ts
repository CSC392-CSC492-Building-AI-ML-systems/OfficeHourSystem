import { buildCalendarTimeSlots } from "@/lib/scheduling/time";
import type { CalendarDay, TimeSlot } from "./types";

// Static calendar grid config. Live sessions/rules load via scheduling server actions.
export const CALENDAR_DAYS: CalendarDay[] = [
  { key: "mon", label: "MON", date: "23" },
  { key: "tue", label: "TUE", date: "24" },
  { key: "wed", label: "WED", date: "25" },
  { key: "thu", label: "THU", date: "26" },
  { key: "fri", label: "FRI", date: "27" },
];

export const TIME_SLOTS: TimeSlot[] = buildCalendarTimeSlots();
