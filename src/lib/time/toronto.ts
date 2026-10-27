export const TORONTO_TIME_ZONE = "America/Toronto";

export type TorontoParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number; // 0 = Sunday
};

const torontoFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TORONTO_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** Wall-clock fields of `date` as seen in Toronto, independent of the machine's time zone. */
export function torontoParts(date: Date): TorontoParts {
  const parts = torontoFormatter.formatToParts(date);

  const valueFor = (type: Intl.DateTimeFormatPartTypes) => {
    const value = parts.find((part) => part.type === type)?.value;
    if (!value) throw new Error(`Missing ${type} in Toronto date`);
    return Number(value);
  };

  const year = valueFor("year");
  const month = valueFor("month");
  const day = valueFor("day");
  return {
    year,
    month,
    day,
    hour: valueFor("hour"),
    minute: valueFor("minute"),
    second: valueFor("second"),
    weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
  };
}

function torontoOffsetMs(utcMs: number): number {
  const whole = new Date(utcMs);
  whole.setUTCMilliseconds(0);
  const p = torontoParts(whole);
  return (
    Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) -
    whole.getTime()
  );
}

/**
 * The instant when Toronto's wall clock reads the given time. Out-of-range
 * fields roll over like `Date.UTC` (e.g. day 32 → next month).
 */
export function torontoDateTime(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0,
): Date {
  const wallMs = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  const guess = wallMs - torontoOffsetMs(wallMs);
  // Second pass corrects the offset when a DST switch lies between wall and guess.
  return new Date(wallMs - torontoOffsetMs(guess));
}

export function getTorontoTodayRange(now = new Date()): {
  start: Date;
  end: Date;
} {
  const { year, month, day } = torontoParts(now);
  const start = torontoDateTime(year, month, day);
  const end = new Date(torontoDateTime(year, month, day + 1).getTime() - 1);

  return { start, end };
}
