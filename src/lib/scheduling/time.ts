/** UI weekday keys used in schedule modals */
export type WeekdayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

/** Visible calendar grid and allowed office-hour booking window (8 AM–10 PM). */
export const CALENDAR_GRID_START_HOUR = 8;
export const CALENDAR_GRID_END_HOUR = 22;

export const OFFICE_HOUR_SLOT_MINUTES = 30;
export const OFFICE_HOUR_MIN_DURATION_MINUTES = 60;

export const OFFICE_HOUR_WINDOW = {
  startMinute: CALENDAR_GRID_START_HOUR * 60,
  endMinute: CALENDAR_GRID_END_HOUR * 60,
  minTimeInput: "08:00",
  maxTimeInput: "22:00",
} as const;

/** Weekdays when office hours may be scheduled (Mon–Fri). */
export const BUSINESS_WEEKDAY_KEYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
] as const satisfies readonly WeekdayKey[];

export type OfficeHourTimeOption = {
  value: string;
  label: string;
};

export function buildOfficeHourStartOptions(): OfficeHourTimeOption[] {
  const maxStartMinute =
    OFFICE_HOUR_WINDOW.endMinute - OFFICE_HOUR_MIN_DURATION_MINUTES;
  const options: OfficeHourTimeOption[] = [];

  for (
    let minute = OFFICE_HOUR_WINDOW.startMinute;
    minute <= maxStartMinute;
    minute += OFFICE_HOUR_SLOT_MINUTES
  ) {
    options.push({
      value: minutesToTimeInput(minute),
      label: formatMinutesAsLabel(minute),
    });
  }

  return options;
}

export function buildOfficeHourEndOptions(
  startTime: string,
): OfficeHourTimeOption[] {
  let startMinute: number;
  try {
    startMinute = parseTimeToMinutes(startTime);
  } catch {
    return [];
  }

  const minEndMinute = startMinute + OFFICE_HOUR_MIN_DURATION_MINUTES;
  const options: OfficeHourTimeOption[] = [];

  for (
    let minute = minEndMinute;
    minute <= OFFICE_HOUR_WINDOW.endMinute;
    minute += OFFICE_HOUR_SLOT_MINUTES
  ) {
    options.push({
      value: minutesToTimeInput(minute),
      label: formatMinutesAsLabel(minute),
    });
  }

  return options;
}

export function pickDefaultEndTime(
  startTime: string,
  currentEndTime: string,
): string {
  const options = buildOfficeHourEndOptions(startTime);
  if (options.length === 0) {
    return currentEndTime;
  }
  if (options.some((option) => option.value === currentEndTime)) {
    return currentEndTime;
  }
  return options[0].value;
}

export function snapOfficeHourStartTime(time: string): string {
  const options = buildOfficeHourStartOptions();
  return (
    options.find((option) => option.value === time)?.value ??
    options[0]?.value ??
    OFFICE_HOUR_WINDOW.minTimeInput
  );
}

export function snapOfficeHourEndTime(
  startTime: string,
  endTime: string,
): string {
  const snappedStart = snapOfficeHourStartTime(startTime);
  return pickDefaultEndTime(snappedStart, endTime);
}

function isHalfHourSlot(minutes: number): boolean {
  return minutes % OFFICE_HOUR_SLOT_MINUTES === 0;
}

export function assertOfficeHourWindow(
  startMinute: number,
  endMinute: number,
): void {
  if (startMinute < OFFICE_HOUR_WINDOW.startMinute) {
    throw new Error("Office hours cannot start before 8:00 AM.");
  }
  if (endMinute > OFFICE_HOUR_WINDOW.endMinute) {
    throw new Error("Office hours cannot end after 10:00 PM.");
  }
  if (endMinute <= startMinute) {
    throw new Error("End time must be after start time.");
  }
  if (!isHalfHourSlot(startMinute)) {
    throw new Error(
      "Start time must be on the hour or half past (e.g. 3:00 or 3:30).",
    );
  }
  if (!isHalfHourSlot(endMinute)) {
    throw new Error(
      "End time must be on the hour or half past (e.g. 4:00 or 4:30).",
    );
  }
  if (endMinute - startMinute < OFFICE_HOUR_MIN_DURATION_MINUTES) {
    throw new Error("Office hours must be at least 1 hour long.");
  }
}

/** Client-side validation for time inputs; returns an error message or null. */
export function validateOfficeHourTimes(
  startTime: string,
  endTime: string,
): string | null {
  try {
    const startMinute = parseTimeToMinutes(startTime);
    const endMinute = parseTimeToMinutes(endTime);
    assertOfficeHourWindow(startMinute, endMinute);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Invalid time.";
  }
}

export interface CalendarTimeSlot {
  label: string;
  hour: number;
}

function formatHourSlotLabel(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12.toString().padStart(2, "0")}:00 ${period}`;
}

export function buildCalendarTimeSlots(): CalendarTimeSlot[] {
  const slots: CalendarTimeSlot[] = [];
  for (
    let hour = CALENDAR_GRID_START_HOUR;
    hour <= CALENDAR_GRID_END_HOUR;
    hour++
  ) {
    slots.push({ label: formatHourSlotLabel(hour), hour });
  }
  return slots;
}

/** Integer grid row/span plus sub-slot offset for fractional start/end times. */
export function sessionGridPlacement(
  startHour: number,
  endHour: number,
  gridStartHour = CALENDAR_GRID_START_HOUR,
): {
  rowStart: number;
  rowSpan: number;
  topOffsetPx: number;
  durationHalfHours: number;
} {
  const startHalfHourIndex = (startHour - gridStartHour) * 2;
  const endHalfHourIndex = (endHour - gridStartHour) * 2;
  const rowStart = 2 + Math.floor(startHalfHourIndex);
  const rowEnd = 2 + Math.ceil(endHalfHourIndex);
  const fractionalStart = startHalfHourIndex - Math.floor(startHalfHourIndex);

  return {
    rowStart,
    rowSpan: Math.max(1, rowEnd - rowStart),
    topOffsetPx: fractionalStart * (CALENDAR_HOUR_HEIGHT / 2),
    durationHalfHours: endHalfHourIndex - startHalfHourIndex,
  };
}

/** Pixel height of one hour row in the weekly calendar grid. */
export const CALENDAR_HOUR_HEIGHT = 132;

const WEEKDAY_KEY_TO_DOW: Record<WeekdayKey, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

const DOW_TO_KEY: WeekdayKey[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

const WEEK_ORDER: WeekdayKey[] = [...BUSINESS_WEEKDAY_KEYS];

const DOW_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/** Parse `HH:mm` (24h) into minutes after midnight. */
export function minutesToTimeInput(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

export function parseTimeToMinutes(time: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) {
    throw new Error(`Invalid time: ${time}`);
  }
  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time: ${time}`);
  }
  return hours * 60 + minutes;
}

export function assertWeekdayKeysAllowed(keys: WeekdayKey[]): void {
  if (keys.some((key) => key === "sat" || key === "sun")) {
    throw new Error("Office hours cannot be scheduled on weekends.");
  }
}

export function assertOfficeHourWeekday(date: Date): void {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    throw new Error("Office hours cannot be scheduled on weekends.");
  }
}

export function validateOfficeHourDate(date: string): string | null {
  try {
    assertOfficeHourWeekday(parseIsoDateOnly(date));
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Invalid date.";
  }
}

export function weekdayKeysToDayOfWeek(keys: WeekdayKey[]): number[] {
  assertWeekdayKeysAllowed(keys);
  const unique = [...new Set(keys.map((key) => WEEKDAY_KEY_TO_DOW[key]))];
  return unique.sort((a, b) => a - b);
}

export function dayOfWeekToKey(dayOfWeek: number): WeekdayKey {
  return DOW_TO_KEY[dayOfWeek] ?? "mon";
}

/** Start of week (Monday 00:00 local) for the date containing `anchor`. */
export function startOfWeekMonday(anchor: Date): Date {
  const d = new Date(anchor);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function parseIsoDateOnly(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) {
    throw new Error(`Invalid date: ${iso}`);
  }
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10) - 1;
  const day = Number.parseInt(match[3], 10);
  return new Date(year, month, day, 0, 0, 0, 0);
}

/** Next Mon–Fri on or after today, as `YYYY-MM-DD` for date inputs. */
export function defaultOfficeHourDateInput(now = new Date()): string {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  return formatDateOnlyLocal(date);
}

/** `YYYY-MM-DD` in local time (for date inputs). */
export function formatDateOnlyLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function endOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Resolve schedule generation bounds from optional UI dates, falling back to term heuristics.
 */
export function resolveScheduleDateBounds(
  termCode: string,
  validFromDate?: string,
  validUntilDate?: string,
): { validFrom: Date; validUntil: Date } {
  const termBounds = getTermBounds(termCode);

  const validFrom = validFromDate?.trim()
    ? parseIsoDateOnly(validFromDate)
    : termBounds.validFrom;

  const validUntil = validUntilDate?.trim()
    ? endOfLocalDay(parseIsoDateOnly(validUntilDate))
    : termBounds.validUntil;

  if (validFrom > validUntil) {
    throw new Error("End date must be on or after start date.");
  }

  return { validFrom, validUntil };
}

/** Inclusive occurrence dates for `dayOfWeek` between `from` and `until`. */
export function datesForDayOfWeek(
  dayOfWeek: number,
  from: Date,
  until: Date,
): Date[] {
  const results: Date[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);

  const end = new Date(until);
  end.setHours(23, 59, 59, 999);

  const offset = (dayOfWeek - cursor.getDay() + 7) % 7;
  cursor.setDate(cursor.getDate() + offset);

  while (cursor <= end) {
    results.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }

  return results;
}

export function combineDateAndMinutes(day: Date, minutes: number): Date {
  const d = new Date(day);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
}

export function formatMinutesAsLabel(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const min = minutes % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${min.toString().padStart(2, "0")} ${period}`;
}

export function formatDateTimeLabel(date: Date): string {
  const h24 = date.getHours();
  const min = date.getMinutes();
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${min.toString().padStart(2, "0")} ${period}`;
}

export function decimalHourFromDate(date: Date): number {
  return date.getHours() + date.getMinutes() / 60;
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatCalendarDateLabel(date: Date): string {
  const month = date.toLocaleString("en-US", { month: "short" });
  return `${month} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatSessionDateLabel(
  startsAt: Date,
  now = new Date(),
): string {
  if (isSameCalendarDay(startsAt, now)) {
    return "Today";
  }
  const dow = DOW_SHORT[startsAt.getDay()];
  const month = startsAt.toLocaleString("en-US", { month: "short" });
  return `${dow}, ${month} ${startsAt.getDate()}`;
}

export function formatWeekRangeLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, WEEK_ORDER.length - 1);
  const startMonth = weekStart.toLocaleString("en-US", { month: "short" });
  const endMonth = weekEnd.toLocaleString("en-US", { month: "short" });
  if (startMonth === endMonth) {
    return `Week of ${startMonth} ${weekStart.getDate()} - ${weekEnd.getDate()}`;
  }
  return `Week of ${startMonth} ${weekStart.getDate()} - ${endMonth} ${weekEnd.getDate()}`;
}

export function buildWeekCalendarDays(weekStart: Date) {
  return WEEK_ORDER.map((key, index) => {
    const date = addDays(weekStart, index);
    return {
      key,
      label: key.toUpperCase(),
      date: String(date.getDate()),
    };
  });
}

/**
 * Rough term bounds from `termCode` (e.g. 2026F, 2026W, 2026S).
 */
export function getTermBounds(
  termCode: string,
  referenceDate = new Date(),
): { validFrom: Date; validUntil: Date } {
  const yearMatch = /^(\d{4})/.exec(termCode);
  const year = yearMatch
    ? Number.parseInt(yearMatch[1], 10)
    : referenceDate.getFullYear();
  const season = termCode.slice(-1).toUpperCase();

  let validFrom: Date;
  let validUntil: Date;

  switch (season) {
    case "W":
      validFrom = new Date(year, 0, 1);
      validUntil = new Date(year, 3, 30, 23, 59, 59, 999);
      break;
    case "S":
      validFrom = new Date(year, 4, 1);
      validUntil = new Date(year, 7, 31, 23, 59, 59, 999);
      break;
    case "F":
    default:
      validFrom = new Date(year, 8, 1);
      validUntil = new Date(year, 11, 31, 23, 59, 59, 999);
      break;
  }

  const now = new Date(referenceDate);
  if (now > validFrom) {
    validFrom = new Date(now);
    validFrom.setHours(0, 0, 0, 0);
  }

  if (validUntil < validFrom) {
    validUntil = addDays(validFrom, 112);
    validUntil.setHours(23, 59, 59, 999);
  }

  return { validFrom, validUntil };
}
