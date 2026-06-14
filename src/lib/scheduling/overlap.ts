import { prisma } from "@/lib/prisma";

import {
  combineDateAndMinutes,
  datesForDayOfWeek,
  endOfLocalDay,
  formatMinutesAsLabel,
  formatSessionDateLabel,
  getTermBounds,
} from "./time";

const DOW_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function minuteRangesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): boolean {
  return startA < endB && startB < endA;
}

export function dateRangesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA <= endB && startB <= endA;
}

export function sessionTimesOverlap(
  startsAtA: Date,
  endsAtA: Date,
  startsAtB: Date,
  endsAtB: Date,
): boolean {
  return startsAtA < endsAtB && startsAtB < endsAtA;
}

function overlapErrorMessage(
  day: Date,
  startMinute: number,
  endMinute: number,
) {
  const dayLabel = formatSessionDateLabel(day);
  const timeLabel = `${formatMinutesAsLabel(startMinute)} - ${formatMinutesAsLabel(endMinute)}`;
  return `This time (${timeLabel}) overlaps with an existing office hour on ${dayLabel}.`;
}

type OverlapSessionQueryOptions = {
  excludeSessionId?: number;
  excludeScheduleIds?: number[];
};

function overlappingSessionWhere(
  offeringId: number,
  startsAt: Date,
  endsAt: Date,
  options?: OverlapSessionQueryOptions,
) {
  const dayStart = new Date(startsAt);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = endOfLocalDay(startsAt);

  return {
    offeringId,
    status: { not: "CANCELLED" as const },
    ...(options?.excludeSessionId
      ? { id: { not: options.excludeSessionId } }
      : {}),
    ...(options?.excludeScheduleIds?.length
      ? {
          OR: [
            { scheduleId: null },
            { scheduleId: { notIn: options.excludeScheduleIds } },
          ],
        }
      : {}),
    AND: [
      { startsAt: { gte: dayStart, lte: dayEnd } },
      { startsAt: { lt: endsAt } },
      { endsAt: { gt: startsAt } },
    ],
  };
}

export async function findOverlappingSession(
  offeringId: number,
  startsAt: Date,
  endsAt: Date,
  options?: OverlapSessionQueryOptions,
) {
  return prisma.officeHourSession.findFirst({
    where: overlappingSessionWhere(offeringId, startsAt, endsAt, options),
    select: { id: true },
  });
}

export async function assertNoOverlappingSession(
  offeringId: number,
  startsAt: Date,
  endsAt: Date,
  options?: OverlapSessionQueryOptions,
): Promise<void> {
  const conflict = await findOverlappingSession(
    offeringId,
    startsAt,
    endsAt,
    options,
  );
  if (conflict) {
    const startMinute = startsAt.getHours() * 60 + startsAt.getMinutes();
    const endMinute = endsAt.getHours() * 60 + endsAt.getMinutes();
    throw new Error(overlapErrorMessage(startsAt, startMinute, endMinute));
  }
}

export async function assertNoOverlappingRecurringSchedule(
  offeringId: number,
  termCode: string,
  dayOfWeek: number,
  startMinute: number,
  endMinute: number,
  validFrom: Date,
  validUntil: Date,
  excludeScheduleIds: number[] = [],
): Promise<void> {
  const schedules = await prisma.officeHourSchedule.findMany({
    where: {
      offeringId,
      isActive: true,
      dayOfWeek,
      startMinute: { lt: endMinute },
      endMinute: { gt: startMinute },
      ...(excludeScheduleIds.length > 0
        ? { id: { notIn: excludeScheduleIds } }
        : {}),
    },
  });

  const termBounds = getTermBounds(termCode);

  for (const schedule of schedules) {
    const scheduleFrom = schedule.validFrom ?? termBounds.validFrom;
    const scheduleUntil = schedule.validUntil ?? termBounds.validUntil;
    if (dateRangesOverlap(validFrom, validUntil, scheduleFrom, scheduleUntil)) {
      throw new Error(
        `This recurring block overlaps with another recurring block on ${DOW_NAMES[dayOfWeek]} (${formatMinutesAsLabel(startMinute)} - ${formatMinutesAsLabel(endMinute)}).`,
      );
    }
  }
}

export type RecurringOccurrenceOverlapOptions = {
  excludeScheduleIds?: number[];
  /** Skip occurrence slots before this instant (e.g. past sessions left unchanged). */
  onlyFrom?: Date;
};

export async function assertNoOverlappingSessionsForRecurringOccurrences(
  offeringId: number,
  dayOfWeek: number,
  startMinute: number,
  endMinute: number,
  validFrom: Date,
  validUntil: Date,
  options?: RecurringOccurrenceOverlapOptions,
): Promise<void> {
  const occurrenceDays = datesForDayOfWeek(dayOfWeek, validFrom, validUntil);

  for (const day of occurrenceDays) {
    const startsAt = combineDateAndMinutes(day, startMinute);
    const endsAt = combineDateAndMinutes(day, endMinute);

    if (options?.onlyFrom && startsAt < options.onlyFrom) {
      continue;
    }

    const conflict = await findOverlappingSession(
      offeringId,
      startsAt,
      endsAt,
      { excludeScheduleIds: options?.excludeScheduleIds },
    );

    if (conflict) {
      throw new Error(overlapErrorMessage(day, startMinute, endMinute));
    }
  }
}
