"use client";

import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
} from "lucide-react";
import {
  addDays,
  CALENDAR_HOUR_HEIGHT,
  formatDateOnlyLocal,
  parseIsoDateOnly,
  sessionGridPlacement,
  startOfWeekMonday,
} from "@/lib/scheduling/time";
import { ScheduleSessionCard } from "./ScheduleSessionCard";
import type { CalendarDay, ScheduleSession, TimeSlot } from "./types";

interface WeeklyCalendarProps {
  days: CalendarDay[];
  timeSlots: TimeSlot[];
  sessions: ScheduleSession[];
  selectedSessionId: string;
  currentUserPublicId?: string | null;
  onSelectSession: (sessionId: string) => void;
  weekLabel?: string;
  weekStart?: string | null;
  onPreviousWeek?: () => void;
  onNextWeek?: () => void;
  onGoToThisWeek?: () => void;
  canEdit?: boolean;
  onCreateRecurring?: () => void;
  onCreateOneTime?: () => void;
}

const HALF_HOUR_ROW_HEIGHT = CALENDAR_HOUR_HEIGHT / 2;
const SESSION_CARD_VERTICAL_MARGIN = 8;

function isoDateForDay(weekStart: string, dayIndex: number): string {
  return formatDateOnlyLocal(addDays(parseIsoDateOnly(weekStart), dayIndex));
}

export function WeeklyCalendar({
  days,
  timeSlots,
  sessions,
  selectedSessionId,
  currentUserPublicId = null,
  onSelectSession,
  weekLabel = "Week View",
  weekStart = null,
  onPreviousWeek,
  onNextWeek,
  onGoToThisWeek,
  canEdit = false,
  onCreateRecurring,
  onCreateOneTime,
}: WeeklyCalendarProps) {
  const todayIso = formatDateOnlyLocal(new Date());
  const currentWeekStart = formatDateOnlyLocal(startOfWeekMonday(new Date()));
  const isCurrentWeek = weekStart === currentWeekStart;

  return (
    <section className="rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_-30px_rgba(15,41,66,0.35)] sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-[#071f41]">{weekLabel}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous week"
            onClick={onPreviousWeek}
            disabled={!onPreviousWeek}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onGoToThisWeek}
            disabled={!onGoToThisWeek || isCurrentWeek}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#071f41] transition hover:bg-slate-50 disabled:cursor-default disabled:opacity-50"
          >
            This week
          </button>
          <button
            type="button"
            aria-label="Next week"
            onClick={onNextWeek}
            disabled={!onNextWeek}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-[#fbfdff]">
        <div className="max-h-[760px] overflow-auto">
          <div
            className="min-w-full"
            style={{ minWidth: `${96 + days.length * 132}px` }}
          >
            <div
              className="grid"
              style={{
                gridTemplateColumns: `96px repeat(${days.length}, minmax(132px, 1fr))`,
                gridTemplateRows: `72px repeat(${timeSlots.length * 2}, ${HALF_HOUR_ROW_HEIGHT}px)`,
              }}
            >
              <div className="sticky left-0 top-0 z-40 border-b border-r border-slate-200/80 bg-white/95 backdrop-blur" />

              {days.map((day, dayIndex) => {
                const isToday =
                  weekStart != null &&
                  isoDateForDay(weekStart, dayIndex) === todayIso;

                return (
                  <div
                    key={day.key}
                    className={`sticky top-0 z-30 flex items-center justify-center border-b px-2 text-center backdrop-blur ${
                      isToday
                        ? "border-b-[#071f41]/30 bg-[#eef5ff]/95"
                        : "border-slate-200/80 bg-white/95"
                    }`}
                    style={{ gridColumn: dayIndex + 2, gridRow: 1 }}
                  >
                    <div>
                      <p
                        className={`text-xs font-semibold tracking-[0.18em] ${
                          isToday ? "text-[#071f41]" : "text-slate-500"
                        }`}
                      >
                        {day.label}
                        {isToday ? (
                          <span className="ml-1.5 rounded-full bg-[#071f41] px-1.5 py-0.5 text-[9px] font-bold tracking-normal text-white">
                            TODAY
                          </span>
                        ) : null}
                      </p>
                      <p
                        className={`mt-1 text-sm font-semibold ${
                          isToday ? "text-[#071f41]" : "text-[#071f41]"
                        }`}
                      >
                        {day.date}
                      </p>
                    </div>
                  </div>
                );
              })}

              {timeSlots.map((slot, index) => (
                <div
                  key={slot.label}
                  className="sticky left-0 z-20 border-r border-t border-slate-200/80 bg-white/95 px-3 pt-3 text-xs font-medium text-slate-500 backdrop-blur"
                  style={{
                    gridColumn: 1,
                    gridRow: `${2 + index * 2} / span 2`,
                  }}
                >
                  {slot.label}
                </div>
              ))}

              {Array.from({ length: timeSlots.length * 2 }).map((_, rowIndex) =>
                days.map((day, dayIndex) => {
                  const isToday =
                    weekStart != null &&
                    isoDateForDay(weekStart, dayIndex) === todayIso;

                  return (
                    <div
                      key={`${day.key}-${rowIndex}`}
                      className={`border-t ${
                        isToday
                          ? "border-[#071f41]/10 bg-[#eef5ff]/40"
                          : rowIndex % 2 === 0
                            ? "border-slate-200/70 bg-white/60"
                            : "border-slate-200/70 bg-[#f8fbff]"
                      } ${dayIndex < days.length - 1 ? "border-r border-r-slate-200/70" : ""}`}
                      style={{
                        gridColumn: dayIndex + 2,
                        gridRow: rowIndex + 2,
                      }}
                    />
                  );
                }),
              )}

              {sessions.map((session) => {
                const dayIndex = days.findIndex(
                  (day) => day.key === session.day,
                );
                if (dayIndex < 0) {
                  return null;
                }
                const { rowStart, rowSpan, topOffsetPx, durationHalfHours } =
                  sessionGridPlacement(session.startHour, session.endHour);
                const durationHeight =
                  durationHalfHours * HALF_HOUR_ROW_HEIGHT -
                  SESSION_CARD_VERTICAL_MARGIN * 2;
                const compact = durationHalfHours <= 2;

                const isHostedByCurrentUser =
                  currentUserPublicId != null &&
                  session.hostPublicIds.includes(currentUserPublicId);

                return (
                  <ScheduleSessionCard
                    key={session.id}
                    session={session}
                    isSelected={session.id === selectedSessionId}
                    isHostedByCurrentUser={isHostedByCurrentUser}
                    compact={compact}
                    onSelect={onSelectSession}
                    style={{
                      gridColumn: dayIndex + 2,
                      gridRow: `${rowStart} / span ${rowSpan}`,
                      margin: `${SESSION_CARD_VERTICAL_MARGIN}px`,
                      marginTop: `${SESSION_CARD_VERTICAL_MARGIN + topOffsetPx}px`,
                      height: `${durationHeight}px`,
                      maxHeight: `${durationHeight}px`,
                      alignSelf: "start",
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#fbfdff]/80 px-6">
            <div className="pointer-events-auto max-w-sm rounded-[24px] border border-slate-200/80 bg-white px-6 py-8 text-center shadow-[0_18px_50px_-30px_rgba(15,41,66,0.25)]">
              <p className="text-sm leading-6 text-slate-600">
                No sessions this week. Create a recurring block for weekly
                office hours, or add a one-time session for a single day.
              </p>
              {canEdit && (onCreateRecurring || onCreateOneTime) ? (
                <div className="mt-5 flex flex-col gap-3">
                  {onCreateRecurring ? (
                    <button
                      type="button"
                      onClick={onCreateRecurring}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f2942]"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Create Recurring Block
                    </button>
                  ) : null}
                  {onCreateOneTime ? (
                    <button
                      type="button"
                      onClick={onCreateOneTime}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#071f41] transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <CalendarPlus className="h-4 w-4" />
                      Add One-time Session
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
