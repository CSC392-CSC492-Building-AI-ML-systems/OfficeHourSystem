import { prisma } from "@/lib/prisma";

import { findOverlappingSession } from "./overlap";
import {
  combineDateAndMinutes,
  datesForDayOfWeek,
  getTermBounds,
} from "./time";

/**
 * Generate SCHEDULED sessions for a recurring rule through validUntil.
 * Skips slots that already exist (same scheduleId + startsAt).
 */
export async function expandOfficeHourSchedule(scheduleId: number) {
  const schedule = await prisma.officeHourSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      hosts: true,
      offering: { select: { termCode: true } },
    },
  });

  if (!schedule || !schedule.isActive) {
    return { created: 0 };
  }

  const termBounds = getTermBounds(schedule.offering.termCode);
  const validFrom = schedule.validFrom ?? termBounds.validFrom;
  const validUntil = schedule.validUntil ?? termBounds.validUntil;

  const occurrenceDays = datesForDayOfWeek(
    schedule.dayOfWeek,
    validFrom,
    validUntil,
  );

  let created = 0;

  for (const day of occurrenceDays) {
    const startsAt = combineDateAndMinutes(day, schedule.startMinute);
    const endsAt = combineDateAndMinutes(day, schedule.endMinute);

    if (endsAt <= startsAt) {
      continue;
    }

    const existing = await prisma.officeHourSession.findFirst({
      where: {
        scheduleId: schedule.id,
        startsAt,
      },
      select: { id: true },
    });

    if (existing) {
      continue;
    }

    const overlap = await findOverlappingSession(
      schedule.offeringId,
      startsAt,
      endsAt,
    );
    if (overlap) {
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const session = await tx.officeHourSession.create({
        data: {
          offeringId: schedule.offeringId,
          scheduleId: schedule.id,
          title: schedule.title,
          type: schedule.type,
          description: schedule.description,
          startsAt,
          endsAt,
          location: schedule.location,
          status: "SCHEDULED",
        },
      });

      if (schedule.hosts.length > 0) {
        await tx.officeHourSessionHost.createMany({
          data: schedule.hosts.map((host) => ({
            sessionId: session.id,
            userId: host.userId,
            role: host.role,
          })),
        });
      }
    });

    created += 1;
  }

  return { created };
}
