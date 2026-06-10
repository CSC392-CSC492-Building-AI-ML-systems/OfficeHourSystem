import type { CourseRole, OfficeHourType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { expandOfficeHourSchedule } from "@/lib/scheduling/expandSchedule";
import {
  requireScheduleMutate,
  requireScheduleView,
  listViewableOfferings,
  ScheduleAuthError,
} from "@/lib/scheduling/auth";
import { randomUUID } from "node:crypto";

import type {
  CreateOneTimeSessionInput,
  CreateRecurringBlockInput,
  QueueSessionDto,
  RecurringRuleDto,
  ScheduleSessionDto,
  UpdateRecurringBlockInput,
  UpdateSessionInput,
} from "@/lib/scheduling/types";
import {
  officeHourTypeLabel,
  uiSessionTypeToOfficeHourType,
} from "@/lib/scheduling/types";
import {
  addDays,
  assertOfficeHourWeekday,
  assertOfficeHourWindow,
  buildWeekCalendarDays,
  combineDateAndMinutes,
  dayOfWeekToKey,
  decimalHourFromDate,
  formatDateTimeLabel,
  formatMinutesAsLabel,
  formatSessionDateLabel,
  formatWeekRangeLabel,
  minutesToTimeInput,
  parseIsoDateOnly,
  parseTimeToMinutes,
  resolveScheduleDateBounds,
  startOfWeekMonday,
  weekdayKeysToDayOfWeek,
} from "@/lib/scheduling/time";

export { ScheduleAuthError, listViewableOfferings };

const DOW_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type ScheduleLike = {
  id: number;
  publicId: string;
  offeringId: number;
  title: string;
  type: OfficeHourType;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  location: string | null;
  validFrom: Date | null;
  validUntil: Date | null;
};

type ScheduleRow = ScheduleLike & {
  blockGroupId: string | null;
};

function readBlockGroupId(schedule: ScheduleLike): string | null {
  const value = (schedule as ScheduleRow).blockGroupId;
  return typeof value === "string" ? value : null;
}

function toScheduleRow(schedule: ScheduleLike): ScheduleRow {
  return {
    ...schedule,
    blockGroupId: readBlockGroupId(schedule),
  };
}

async function getScheduleAnchor(publicId: string) {
  const anchor = await prisma.officeHourSchedule.findUnique({
    where: { publicId },
    include: { offering: true },
  });
  if (!anchor) {
    throw new ScheduleAuthError("Recurring block not found.", 404);
  }
  return anchor;
}

async function resolveBlockSchedules(anchor: ScheduleRow) {
  if (anchor.blockGroupId) {
    const schedules = await prisma.officeHourSchedule.findMany({
      where: {
        offeringId: anchor.offeringId,
        isActive: true,
      },
      orderBy: { dayOfWeek: "asc" },
    });

    return schedules.filter(
      (schedule) => readBlockGroupId(schedule) === anchor.blockGroupId,
    );
  }

  return prisma.officeHourSchedule.findMany({
    where: {
      offeringId: anchor.offeringId,
      title: anchor.title,
      startMinute: anchor.startMinute,
      endMinute: anchor.endMinute,
      validFrom: anchor.validFrom,
      validUntil: anchor.validUntil,
      type: anchor.type,
      isActive: true,
    },
    orderBy: { dayOfWeek: "asc" },
  });
}

function blockGroupMapKey(schedule: ScheduleRow) {
  if (schedule.blockGroupId) {
    return `group:${schedule.blockGroupId}`;
  }
  return [
    "legacy",
    schedule.title,
    schedule.startMinute,
    schedule.endMinute,
    schedule.validFrom?.toISOString() ?? "",
    schedule.validUntil?.toISOString() ?? "",
    schedule.type,
  ].join(":");
}

function inferLocationMode(
  location: string | null | undefined,
): "in-person" | "online" | "hybrid" {
  const value = (location ?? "").toLowerCase();
  if (
    value.includes("zoom") ||
    value.includes("virtual") ||
    value.includes("online")
  ) {
    return "online";
  }
  if (value.includes("hybrid")) {
    return "hybrid";
  }
  return "in-person";
}

function accentForType(type: OfficeHourType): ScheduleSessionDto["accent"] {
  switch (type) {
    case "DEBUGGING":
      return "yellow";
    case "GROUP":
      return "navy-red";
    default:
      return "navy-yellow";
  }
}

function ruleAccentForType(type: OfficeHourType): RecurringRuleDto["accent"] {
  switch (type) {
    case "DEBUGGING":
      return "gold";
    case "GROUP":
      return "red";
    default:
      return "navy";
  }
}

type SessionWithRelations = Prisma.OfficeHourSessionGetPayload<{
  include: {
    offering: { include: { course: true } };
    schedule: true;
  };
}>;

function mapSessionToDto(
  session: SessionWithRelations,
  courseCode: string,
  now = new Date(),
): ScheduleSessionDto {
  const defaultLocation = session.schedule?.location ?? session.location ?? "";
  const sessionLocation = session.location ?? defaultLocation;
  const hasLocationOverride =
    session.scheduleId != null &&
    session.location != null &&
    session.location !== session.schedule?.location;

  const sessionTypeLabel = officeHourTypeLabel(session.type);

  return {
    id: session.publicId,
    courseCode,
    courseName: undefined,
    sessionTypeLabel,
    calendarLabel: sessionTypeLabel,
    title: session.title,
    topic: session.title,
    day: dayOfWeekToKey(session.startsAt.getDay()),
    dateLabel: formatSessionDateLabel(session.startsAt, now),
    startTime: formatDateTimeLabel(session.startsAt),
    endTime: formatDateTimeLabel(session.endsAt),
    startHour: decimalHourFromDate(session.startsAt),
    endHour: decimalHourFromDate(session.endsAt),
    location: sessionLocation,
    mode: inferLocationMode(sessionLocation),
    accent: accentForType(session.type),
    hasLocationOverride,
    overrideLocation: hasLocationOverride ? sessionLocation : undefined,
  };
}

async function resolveHostRows(
  offeringId: number,
  hostUserPublicIds: string[] | undefined,
) {
  if (!hostUserPublicIds?.length) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: { publicId: { in: hostUserPublicIds } },
    select: { id: true, publicId: true },
  });

  const hosts: { userId: number; role: CourseRole }[] = [];

  for (const user of users) {
    const member = await prisma.offeringMember.findUnique({
      where: {
        userId_offeringId: { userId: user.id, offeringId },
      },
      select: { role: true },
    });
    if (member && member.role !== "STUDENT") {
      hosts.push({ userId: user.id, role: member.role });
    }
  }

  return hosts;
}

export async function createRecurringBlock(
  userId: number,
  input: CreateRecurringBlockInput,
) {
  const access = await requireScheduleMutate(userId, input.offeringPublicId);
  const startMinute = parseTimeToMinutes(input.startTime);
  const endMinute = parseTimeToMinutes(input.endTime);
  assertOfficeHourWindow(startMinute, endMinute);

  const days = weekdayKeysToDayOfWeek(input.weekdayKeys);
  if (days.length === 0) {
    throw new Error("Select at least one weekday.");
  }

  const scheduleBounds = resolveScheduleDateBounds(
    access.termCode,
    input.validFrom,
    input.validUntil,
  );
  const type = uiSessionTypeToOfficeHourType(input.uiType);
  const hosts = await resolveHostRows(
    access.offeringId,
    input.hostUserPublicIds,
  );

  const schedulePublicIds: string[] = [];
  let sessionsCreated = 0;
  const blockGroupId = randomUUID();

  for (const dayOfWeek of days) {
    const schedule = await prisma.$transaction(async (tx) => {
      const created = await tx.officeHourSchedule.create({
        data: {
          offeringId: access.offeringId,
          title: input.title,
          type,
          dayOfWeek,
          startMinute,
          endMinute,
          location: input.location ?? null,
          validFrom: scheduleBounds.validFrom,
          validUntil: scheduleBounds.validUntil,
          isActive: true,
          blockGroupId,
        } as Prisma.OfficeHourScheduleUncheckedCreateInput,
      });

      if (hosts.length > 0) {
        await tx.officeHourScheduleHost.createMany({
          data: hosts.map((host) => ({
            scheduleId: created.id,
            userId: host.userId,
            role: host.role,
          })),
        });
      }

      return created;
    });

    schedulePublicIds.push(schedule.publicId);
    const expanded = await expandOfficeHourSchedule(schedule.id);
    sessionsCreated += expanded.created;
  }

  return { schedulePublicIds, sessionsCreated };
}

export async function createOneTimeSession(
  userId: number,
  input: CreateOneTimeSessionInput,
) {
  const access = await requireScheduleMutate(userId, input.offeringPublicId);
  const day = parseIsoDateOnly(input.date);
  assertOfficeHourWeekday(day);
  const startMinute = parseTimeToMinutes(input.startTime);
  const endMinute = parseTimeToMinutes(input.endTime);
  assertOfficeHourWindow(startMinute, endMinute);
  const startsAt = combineDateAndMinutes(day, startMinute);
  const endsAt = combineDateAndMinutes(day, endMinute);

  const type = uiSessionTypeToOfficeHourType(input.uiType);
  const hosts = await resolveHostRows(
    access.offeringId,
    input.hostUserPublicIds,
  );

  const session = await prisma.$transaction(async (tx) => {
    const created = await tx.officeHourSession.create({
      data: {
        offeringId: access.offeringId,
        scheduleId: null,
        title: input.title,
        type,
        startsAt,
        endsAt,
        location: input.location ?? null,
        status: "SCHEDULED",
      },
      include: {
        offering: { include: { course: true } },
        schedule: true,
      },
    });

    if (hosts.length > 0) {
      await tx.officeHourSessionHost.createMany({
        data: hosts.map((host) => ({
          sessionId: created.id,
          userId: host.userId,
          role: host.role,
        })),
      });
    }

    return created;
  });

  return {
    session: mapSessionToDto(session, access.courseCode),
  };
}

export async function listScheduleWeek(
  userId: number,
  offeringPublicId: string,
  weekStartInput?: string,
) {
  const access = await requireScheduleView(userId, offeringPublicId);
  const weekStart = weekStartInput
    ? startOfWeekMonday(parseIsoDateOnly(weekStartInput))
    : startOfWeekMonday(new Date());
  const weekEnd = addDays(weekStart, 5);

  const sessions = await prisma.officeHourSession.findMany({
    where: {
      offeringId: access.offeringId,
      startsAt: { gte: weekStart, lt: weekEnd },
      status: { not: "CANCELLED" },
    },
    include: {
      offering: { include: { course: true } },
      schedule: true,
    },
    orderBy: { startsAt: "asc" },
  });

  const rules = await listRecurringRules(userId, offeringPublicId);

  return {
    access,
    weekStart: weekStart.toISOString().slice(0, 10),
    weekLabel: formatWeekRangeLabel(weekStart),
    calendarDays: buildWeekCalendarDays(weekStart),
    sessions: sessions.map((s) => mapSessionToDto(s, access.courseCode)),
    rules,
  };
}

export async function listRecurringRules(
  userId: number,
  offeringPublicId: string,
): Promise<RecurringRuleDto[]> {
  const access = await requireScheduleView(userId, offeringPublicId);

  const schedules = await prisma.officeHourSchedule.findMany({
    where: { offeringId: access.offeringId, isActive: true },
    orderBy: [{ title: "asc" }, { dayOfWeek: "asc" }],
  });

  const byBlock = new Map<string, typeof schedules>();

  for (const schedule of schedules) {
    const key = blockGroupMapKey(toScheduleRow(schedule));
    const group = byBlock.get(key) ?? [];
    group.push(schedule);
    byBlock.set(key, group);
  }

  const rules: RecurringRuleDto[] = [];

  for (const [, group] of byBlock) {
    const first = group[0];
    const repeatDays = group.map((s) => DOW_NAMES[s.dayOfWeek]).join(", ");

    rules.push({
      id: first.publicId,
      courseCode: access.courseCode,
      sessionTypeLabel: officeHourTypeLabel(first.type),
      title: first.title,
      repeats: repeatDays,
      defaultTime: `${formatMinutesAsLabel(first.startMinute)} - ${formatMinutesAsLabel(first.endMinute)}`,
      startTime: minutesToTimeInput(first.startMinute),
      endTime: minutesToTimeInput(first.endMinute),
      defaultLocation: first.location ?? "TBD",
      mode: inferLocationMode(first.location),
      accent: ruleAccentForType(first.type),
    });
  }

  return rules;
}

export async function updateRecurringBlock(
  userId: number,
  anchorPublicId: string,
  patch: UpdateRecurringBlockInput,
) {
  const anchor = await getScheduleAnchor(anchorPublicId);
  await requireScheduleMutate(userId, anchor.offering.publicId);

  const group = await resolveBlockSchedules(toScheduleRow(anchor));
  if (group.length === 0) {
    throw new ScheduleAuthError("Recurring block not found.", 404);
  }

  const nextStartMinute =
    patch.startTime !== undefined
      ? parseTimeToMinutes(patch.startTime)
      : undefined;
  const nextEndMinute =
    patch.endTime !== undefined ? parseTimeToMinutes(patch.endTime) : undefined;

  const startMinute = nextStartMinute ?? group[0].startMinute;
  const endMinute = nextEndMinute ?? group[0].endMinute;
  assertOfficeHourWindow(startMinute, endMinute);

  const scheduleIds = group.map((row) => row.id);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.officeHourSchedule.updateMany({
      where: { id: { in: scheduleIds } },
      data: {
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.location !== undefined ? { location: patch.location } : {}),
        ...(nextStartMinute !== undefined
          ? { startMinute: nextStartMinute }
          : {}),
        ...(nextEndMinute !== undefined ? { endMinute: nextEndMinute } : {}),
      },
    });

    const sessions = await tx.officeHourSession.findMany({
      where: {
        scheduleId: { in: scheduleIds },
        status: "SCHEDULED",
        startsAt: { gte: now },
      },
    });

    for (const session of sessions) {
      const day = new Date(session.startsAt);
      day.setHours(0, 0, 0, 0);
      await tx.officeHourSession.update({
        where: { id: session.id },
        data: {
          ...(patch.title !== undefined ? { title: patch.title } : {}),
          ...(patch.location !== undefined ? { location: patch.location } : {}),
          startsAt: combineDateAndMinutes(day, startMinute),
          endsAt: combineDateAndMinutes(day, endMinute),
        },
      });
    }
  });

  return { ok: true };
}

export async function deleteRecurringBlock(
  userId: number,
  anchorPublicId: string,
) {
  const anchor = await getScheduleAnchor(anchorPublicId);
  await requireScheduleMutate(userId, anchor.offering.publicId);

  const group = await resolveBlockSchedules(toScheduleRow(anchor));
  if (group.length === 0) {
    throw new ScheduleAuthError("Recurring block not found.", 404);
  }

  const scheduleIds = group.map((row) => row.id);

  await prisma.$transaction(async (tx) => {
    await tx.officeHourSchedule.updateMany({
      where: { id: { in: scheduleIds } },
      data: { isActive: false },
    });

    await tx.officeHourSession.updateMany({
      where: {
        scheduleId: { in: scheduleIds },
        status: "SCHEDULED",
      },
      data: { status: "CANCELLED" },
    });
  });

  return { ok: true, schedulesDeactivated: scheduleIds.length };
}

export async function updateSession(
  userId: number,
  sessionPublicId: string,
  patch: UpdateSessionInput,
) {
  const existing = await prisma.officeHourSession.findUnique({
    where: { publicId: sessionPublicId },
    include: {
      offering: { include: { course: true } },
      schedule: true,
    },
  });

  if (!existing) {
    throw new ScheduleAuthError("Session not found.", 404);
  }

  await requireScheduleMutate(userId, existing.offering.publicId);

  let startsAt = existing.startsAt;
  let endsAt = existing.endsAt;

  if (patch.date || patch.startTime) {
    const day = patch.date
      ? parseIsoDateOnly(patch.date)
      : new Date(existing.startsAt);
    assertOfficeHourWeekday(day);
    const startMinute = patch.startTime
      ? parseTimeToMinutes(patch.startTime)
      : existing.startsAt.getHours() * 60 + existing.startsAt.getMinutes();
    startsAt = combineDateAndMinutes(day, startMinute);
  }

  if (patch.endTime) {
    const day = patch.date ? parseIsoDateOnly(patch.date) : new Date(startsAt);
    endsAt = combineDateAndMinutes(day, parseTimeToMinutes(patch.endTime));
  }

  const startMinute = startsAt.getHours() * 60 + startsAt.getMinutes();
  const endMinute = endsAt.getHours() * 60 + endsAt.getMinutes();
  assertOfficeHourWindow(startMinute, endMinute);

  const updated = await prisma.officeHourSession.update({
    where: { id: existing.id },
    data: {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.location !== undefined ? { location: patch.location } : {}),
      startsAt,
      endsAt,
    },
    include: {
      offering: { include: { course: true } },
      schedule: true,
    },
  });

  return {
    session: mapSessionToDto(updated, existing.offering.course.code),
  };
}

export async function cancelSession(userId: number, sessionPublicId: string) {
  const existing = await prisma.officeHourSession.findUnique({
    where: { publicId: sessionPublicId },
    include: { offering: true },
  });

  if (!existing) {
    throw new ScheduleAuthError("Session not found.", 404);
  }

  await requireScheduleMutate(userId, existing.offering.publicId);

  await prisma.officeHourSession.update({
    where: { id: existing.id },
    data: { status: "CANCELLED" },
  });

  return { ok: true };
}

export async function getInstructorSchedulePage(
  userId: number,
  offeringPublicId?: string,
  weekStart?: string,
) {
  const offerings = await listViewableOfferings(userId);

  if (offerings.length === 0) {
    return {
      offerings: [],
      offering: null,
      weekStart: null,
      weekLabel: null,
      calendarDays: [],
      sessions: [],
      rules: [],
      canEdit: false,
    };
  }

  const selected =
    offerings.find((o) => o.offeringPublicId === offeringPublicId) ??
    offerings[0];

  const week = await listScheduleWeek(
    userId,
    selected.offeringPublicId,
    weekStart,
  );

  return {
    offerings,
    offering: {
      offeringPublicId: selected.offeringPublicId,
      courseCode: selected.courseCode,
      termCode: selected.termCode,
      role: selected.role,
      canEdit: selected.canEdit,
    },
    weekStart: week.weekStart,
    weekLabel: week.weekLabel,
    calendarDays: week.calendarDays,
    sessions: week.sessions,
    rules: week.rules,
    canEdit: selected.canEdit,
  };
}

export async function getUpcomingSessionsForHost(
  userId: number,
  options?: { types?: OfficeHourType[]; daysAhead?: number },
) {
  const now = new Date();
  const daysAhead = options?.daysAhead ?? 14;
  const until = addDays(now, daysAhead);

  const sessions = await prisma.officeHourSession.findMany({
    where: {
      startsAt: { gte: now, lte: until },
      status: { not: "CANCELLED" },
      hosts: { some: { userId } },
      ...(options?.types?.length ? { type: { in: options.types } } : {}),
    },
    include: {
      offering: { include: { course: true } },
      hosts: { include: { user: true } },
      attendances: {
        orderBy: { checkedInAt: "desc" },
        take: 1,
        include: { student: true },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  return sessions.map((session, index): QueueSessionDto => {
    const lastAttendance = session.attendances[0];
    const studentName = [
      lastAttendance?.student.firstName,
      lastAttendance?.student.lastName,
    ]
      .filter(Boolean)
      .join(" ");
    const lastScanLabel = lastAttendance
      ? `${studentName || lastAttendance.student.utorid} checked in`
      : "No check-ins yet";

    const isToday = formatSessionDateLabel(session.startsAt) === "Today";

    return {
      id: session.publicId,
      courseLabel:
        `${session.offering.course.code} ${session.title}`.toUpperCase(),
      title:
        session.type === "DEBUGGING"
          ? "Debugging Queue"
          : session.type === "GROUP"
            ? "Topic Group"
            : "General Office Hours",
      time: `${isToday ? "Today" : formatSessionDateLabel(session.startsAt)}, ${formatDateTimeLabel(session.startsAt)} - ${formatDateTimeLabel(session.endsAt)}`,
      location: session.location ?? "TBD",
      isHighlighted: index === 0 && session.type === "DEBUGGING",
      workspaceSubtitle: `${session.offering.course.code}: ${session.title}`,
      lastScanLabel,
    };
  });
}
