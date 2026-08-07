const TORONTO_TIME_ZONE = "America/Toronto";

type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

type LocalDateTime = CalendarDate & {
  hour: number;
  minute: number;
  second: number;
};

function localDateTimeInToronto(date: Date): LocalDateTime {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TORONTO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const valueFor = (type: Intl.DateTimeFormatPartTypes) => {
    const value = parts.find((part) => part.type === type)?.value;
    if (!value) throw new Error(`Missing ${type} in Toronto date`);
    return Number(value);
  };

  return {
    year: valueFor("year"),
    month: valueFor("month"),
    day: valueFor("day"),
    hour: valueFor("hour"),
    minute: valueFor("minute"),
    second: valueFor("second"),
  };
}

function calendarDateInToronto(date: Date): CalendarDate {
  const { year, month, day } = localDateTimeInToronto(date);
  return { year, month, day };
}

function midnightInTorontoUtc({ year, month, day }: CalendarDate): Date {
  const utcGuess = new Date(Date.UTC(year, month - 1, day));
  const localAtGuess = localDateTimeInToronto(utcGuess);
  const localAsUtc = Date.UTC(
    localAtGuess.year,
    localAtGuess.month - 1,
    localAtGuess.day,
    localAtGuess.hour,
    localAtGuess.minute,
    localAtGuess.second,
  );
  const offsetMs = localAsUtc - utcGuess.getTime();

  return new Date(utcGuess.getTime() - offsetMs);
}

function nextCalendarDate({ year, month, day }: CalendarDate): CalendarDate {
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  };
}

export function getTorontoTodayRange(now = new Date()): {
  start: Date;
  end: Date;
} {
  const today = calendarDateInToronto(now);
  const start = midnightInTorontoUtc(today);
  const tomorrow = nextCalendarDate(today);
  const end = new Date(midnightInTorontoUtc(tomorrow).getTime() - 1);

  return { start, end };
}
